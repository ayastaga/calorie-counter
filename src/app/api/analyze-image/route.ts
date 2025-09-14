// /src/app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ImageData {
  url: string;
  key: string;
  name: string;
}

interface NutritionData {
  food_name: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_saturated_fat: number;
  nf_cholesterol: number;
  nf_sodium: number;
  nf_total_carbohydrate: number;
  nf_dietary_fiber: number;
  nf_sugars: number;
  nf_protein: number;
}

interface Dish {
  name: string;
  servingSize: string;
  nutrition?: NutritionData;
  error?: string;
}

interface ImageAnalysis {
  imageUrl: string;
  imageName: string;
  imageKey: string;
  description: string;
  confidence: number;
  objects?: string[];
  text?: string;
  dishes?: Dish[];
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

interface AnalysisResult {
  images: ImageAnalysis[];
  overallTotalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return base64;
  } catch (error) {
    console.error("Error fetching image:", error);
    throw error;
  }
}

async function getNutritionData(
  dishName: string
): Promise<NutritionData | null> {
  try {
    if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) {
      console.warn("Nutritionix API credentials not configured");
      return null;
    }

    const response = await fetch(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-id": process.env.NUTRITIONIX_APP_ID,
          "x-app-key": process.env.NUTRITIONIX_API_KEY,
        },
        body: JSON.stringify({
          query: dishName,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `Nutritionix API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (data.foods && data.foods.length > 0) {
      return data.foods[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    return null;
  }
}

async function analyzeImageWithGemini(
  imageBase64: string,
  mimeType: string,
  imageData: ImageData
): Promise<ImageAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this food image in detail. Provide:
    1. A detailed description of what you see (keep it concise)
    2. List of specific dishes/food items with their approximate serving sizes (be specific about dish names for nutrition lookup)
    3. List of ingredients/objects you can identify
    4. Your confidence level in the analysis
    
    For dishes, use common, searchable names (e.g., "chicken breast grilled", "caesar salad", "chocolate chip cookie" rather than vague terms).
    
    Please respond in JSON format with the following structure:
    {
      "description": "detailed description of the food image",
      "dishes": [
        {
          "name": "specific dish name",
          "servingSize": "1 serving" or "1 cup" etc
        }
      ],
      "objects": ["ingredient1", "ingredient2", "ingredient3"],
      "confidence": 0.95
    }`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      // Clean up the response text (remove markdown code blocks if present)
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      const analysisResult = JSON.parse(cleanText);

      // Ensure confidence is a number between 0 and 1
      if (typeof analysisResult.confidence === "number") {
        analysisResult.confidence = Math.min(
          1,
          Math.max(0, analysisResult.confidence)
        );
      } else {
        analysisResult.confidence = 0.8; // Default confidence
      }

      // Get nutrition data for each dish
      if (analysisResult.dishes && Array.isArray(analysisResult.dishes)) {
        const dishesWithNutrition = await Promise.all(
          analysisResult.dishes.map(async (dish: any) => {
            const nutrition = await getNutritionData(dish.name);
            return {
              ...dish,
              nutrition: nutrition || undefined,
              error: nutrition ? undefined : "Nutrition data not found",
            };
          })
        );

        analysisResult.dishes = dishesWithNutrition;

        // Calculate total nutrition for this image
        const totalNutrition = dishesWithNutrition.reduce(
          (total, dish) => {
            if (dish.nutrition) {
              return {
                calories: total.calories + (dish.nutrition.nf_calories || 0),
                protein: total.protein + (dish.nutrition.nf_protein || 0),
                carbs:
                  total.carbs + (dish.nutrition.nf_total_carbohydrate || 0),
                fat: total.fat + (dish.nutrition.nf_total_fat || 0),
                fiber: total.fiber + (dish.nutrition.nf_dietary_fiber || 0),
                sodium: total.sodium + (dish.nutrition.nf_sodium || 0),
              };
            }
            return total;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
        );

        if (totalNutrition.calories > 0) {
          analysisResult.totalNutrition = totalNutrition;
        }
      }

      return {
        imageUrl: imageData.url,
        imageName: imageData.name,
        imageKey: imageData.key,
        description: analysisResult.description,
        confidence: analysisResult.confidence,
        objects: analysisResult.objects || [],
        dishes: analysisResult.dishes || [],
        totalNutrition: analysisResult.totalNutrition,
      };
    } catch (parseError) {
      // If JSON parsing fails, return a structured response from the text
      return {
        imageUrl: imageData.url,
        imageName: imageData.name,
        imageKey: imageData.key,
        description: text,
        confidence: 0.75,
        objects: [],
        dishes: [],
      };
    }
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image ${imageData.name}`);
  }
}

function getMimeTypeFromUrl(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg"; // Default fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { images } = body as { images: ImageData[] };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    console.log(`Starting analysis of ${images.length} images`);

    try {
      // Analyze all images in parallel
      const analysisPromises = images.map(async (imageData) => {
        try {
          // Fetch the image as base64
          const imageBase64 = await fetchImageAsBase64(imageData.url);
          const mimeType = getMimeTypeFromUrl(imageData.url);

          // Analyze the image with Gemini
          return await analyzeImageWithGemini(imageBase64, mimeType, imageData);
        } catch (error) {
          console.error(`Error analyzing image ${imageData.name}:`, error);
          // Return a partial result for failed images
          return {
            imageUrl: imageData.url,
            imageName: imageData.name,
            imageKey: imageData.key,
            description: `Failed to analyze image: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            confidence: 0,
            objects: [],
            dishes: [],
          };
        }
      });

      const imageAnalyses = await Promise.all(analysisPromises);

      // Calculate overall total nutrition from all images
      const overallTotalNutrition = imageAnalyses.reduce(
        (overallTotal, imageAnalysis) => {
          if (imageAnalysis.totalNutrition) {
            return {
              calories:
                overallTotal.calories + imageAnalysis.totalNutrition.calories,
              protein:
                overallTotal.protein + imageAnalysis.totalNutrition.protein,
              carbs: overallTotal.carbs + imageAnalysis.totalNutrition.carbs,
              fat: overallTotal.fat + imageAnalysis.totalNutrition.fat,
              fiber: overallTotal.fiber + imageAnalysis.totalNutrition.fiber,
              sodium: overallTotal.sodium + imageAnalysis.totalNutrition.sodium,
            };
          }
          return overallTotal;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
      );

      const result: AnalysisResult = {
        images: imageAnalyses,
        overallTotalNutrition:
          overallTotalNutrition.calories > 0
            ? overallTotalNutrition
            : undefined,
      };

      console.log(
        `Analysis complete for ${images.length} images. Total calories: ${overallTotalNutrition.calories}`
      );

      return NextResponse.json(result);
    } catch (analysisError) {
      console.error("Analysis error:", analysisError);

      return NextResponse.json(
        { error: "Failed to analyze images" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Image analysis API is running. Use POST to analyze images." },
    { status: 200 }
  );
}

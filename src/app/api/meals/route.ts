// app/api/meals/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      mealName,
      mealType,
      imageUrl,
      description,
      totalNutrition,
      dishes,
    } = body;

    // Insert the main meal record
    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        meal_name: mealName,
        meal_type: mealType,
        image_url: imageUrl,
        description: description,
        total_calories: totalNutrition.calories,
        total_protein: totalNutrition.protein,
        total_carbs: totalNutrition.carbs,
        total_fat: totalNutrition.fat,
        total_fiber: totalNutrition.fiber,
        total_sodium: totalNutrition.sodium,
      })
      .select()
      .single();

    if (mealError) {
      console.error("Error inserting meal:", mealError);
      return NextResponse.json(
        { error: "Failed to save meal" },
        { status: 500 }
      );
    }

    // Insert individual dishes if provided
    if (dishes && dishes.length > 0) {
      const dishData = dishes.map((dish: any) => ({
        meal_id: mealData.id,
        dish_name: dish.name,
        serving_size: dish.servingSize,
        serving_qty: dish.nutrition?.serving_qty || 1,
        serving_unit: dish.nutrition?.serving_unit || "serving",
        serving_weight_grams: dish.nutrition?.serving_weight_grams || 0,
        calories: dish.nutrition?.nf_calories || 0,
        protein: dish.nutrition?.nf_protein || 0,
        total_fat: dish.nutrition?.nf_total_fat || 0,
        saturated_fat: dish.nutrition?.nf_saturated_fat || 0,
        cholesterol: dish.nutrition?.nf_cholesterol || 0,
        sodium: dish.nutrition?.nf_sodium || 0,
        total_carbohydrate: dish.nutrition?.nf_total_carbohydrate || 0,
        dietary_fiber: dish.nutrition?.nf_dietary_fiber || 0,
        sugars: dish.nutrition?.nf_sugars || 0,
      }));

      const { error: dishesError } = await supabase
        .from("meal_dishes")
        .insert(dishData);

      if (dishesError) {
        console.error("Error inserting dishes:", dishesError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      mealId: mealData.id,
      message: "Meal saved successfully!",
    });
  } catch (error) {
    console.error("Error saving meal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const mealType = url.searchParams.get("mealType");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    console.log("Meals API - Query parameters:", {
      startDate,
      endDate,
      mealType,
      limit,
      userId: user.id,
    });

    let query = supabase
      .from("meals")
      .select(
        `
        *,
        meal_dishes (*)
      `
      )
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(limit);

    // Apply date filters with proper timezone handling
    if (startDate) {
      // Use the start of the day for the start date
      query = query.gte("logged_at", `${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      // Use the end of the day for the end date
      query = query.lte("logged_at", `${endDate}T23:59:59.999Z`);
    }

    if (mealType && mealType !== "all") {
      query = query.eq("meal_type", mealType);
    }

    console.log("Executing meals query...");
    const { data: meals, error } = await query;

    if (error) {
      console.error("Error fetching meals:", error);
      return NextResponse.json(
        { error: "Failed to fetch meals", details: error.message },
        { status: 500 }
      );
    }

    console.log(`Found ${meals?.length || 0} meals for user ${user.id}`);

    // Debug: Log the first few meals to check data
    if (meals && meals.length > 0) {
      console.log(
        "Sample meals:",
        meals.slice(0, 3).map((meal) => ({
          id: meal.id,
          name: meal.meal_name,
          logged_at: meal.logged_at,
          type: meal.meal_type,
        }))
      );
    }

    return NextResponse.json({
      meals: meals || [],
      count: meals?.length || 0,
      query_params: {
        startDate,
        endDate,
        mealType,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching meals:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

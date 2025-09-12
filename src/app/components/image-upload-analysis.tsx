"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { uploadFiles } from "@/lib/uploadthing";
import type { UploadedFile } from "@/types";
import {
  Loader2,
  X,
  Eye,
  Upload,
  Trash2,
  Utensils,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { toast } from "sonner";
import { UploadThingError } from "uploadthing/server";

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

interface AnalysisResult {
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

export default function ImageUploadAnalysisCard() {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const onUpload = useCallback(
    async (
      files: File[],
      {
        onProgress,
      }: {
        onProgress: (file: File, progress: number) => void;
      }
    ) => {
      try {
        setIsUploading(true);
        setError(null);
        const res = await uploadFiles("imageUploader", {
          files,
          onUploadProgress: ({ file, progress }) => {
            onProgress(file, progress);
          },
        });
        setUploadedFiles((prev) => [...prev, ...res]);
        toast.success("Files uploaded successfully!", {
          description: `${res.length} file(s) ready for analysis`,
        });
      } catch (error) {
        setIsUploading(false);
        console.error("Upload error details:", error);

        if (error instanceof UploadThingError) {
          console.error("UploadThing error code:", error.code);
          console.error("UploadThing error data:", error.data);
          const errorMessage =
            error.data && "error" in error.data
              ? error.data.error
              : `Upload failed: ${error.message || error.code}`;
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        console.error("General upload error:", message);
        setError(`Upload failed: ${message}`);
        toast.error(`Upload failed: ${message}`);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const onFileReject = useCallback((file: File, message: string) => {
    toast.error(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" has been rejected`,
    });
  }, []);

  const handleFileDelete = async (file: File, index: number) => {
    const uploadedFile = uploadedFiles.find(
      (uf) => uf.name === file.name && uf.size === file.size
    );

    if (uploadedFile) {
      setDeletingFiles((prev) => new Set([...prev, uploadedFile.key]));

      try {
        const response = await fetch("/api/delete-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileKey: uploadedFile.key }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete file from server");
        }

        setUploadedFiles((prev) =>
          prev.filter((uf) => uf.key !== uploadedFile.key)
        );
        setFiles((prev) => prev.filter((_, i) => i !== index));

        toast.success("File deleted successfully", {
          description: `"${file.name}" has been removed from server and queue`,
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        const message =
          error instanceof Error ? error.message : "Failed to delete file";
        setError(message);
        toast.error(message);
      } finally {
        setDeletingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(uploadedFile.key);
          return newSet;
        });
      }
    } else {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      toast.success("File removed from queue");
    }
  };

  const analyzeImages = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one image first");
      toast.error("Please upload at least one image first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: uploadedFiles.map((file) => ({
            url: file.url,
            key: file.key,
            name: file.name,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await response.json();
      setAnalysisResult(result);
      setUploadedFiles([]);
      setFiles([]);

      // Debug info in browser console
      if (result.debug) {
        console.log("=== NUTRITION DEBUG INFO ===");
        console.log("Dishes processed:", result.debug.dishesProcessed);
        console.log("Dishes with nutrition:", result.debug.dishesWithNutrition);
        console.log("Nutritionix queries:", result.debug.nutritionixQueries);
        console.log("=== END DEBUG ===");
      }

      toast.success("Analysis complete!", {
        description: "Your images have been analyzed and cleaned up.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const message =
        error instanceof Error ? error.message : "Analysis failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const formatNutrientValue = (value: number, unit: string = "g") => {
    return `${Math.round(value * 10) / 10}${unit}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Food Analysis & Nutrition
        </CardTitle>
        <CardDescription>
          Upload food images to get detailed nutritional information, calorie
          counts, and ingredient analysis powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          accept="image/*"
          maxFiles={5}
          maxSize={4 * 1024 * 1024}
          onAccept={(files) => setFiles(files)}
          onUpload={onUpload}
          onFileReject={onFileReject}
          multiple
          disabled={isUploading || isAnalyzing}
        >
          <FileUploadDropzone>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center rounded-full border p-2.5">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">
                Drag & drop food images here
              </p>
              <p className="text-muted-foreground text-xs">
                Or click to browse (max 5 files, up to 4MB each)
              </p>
            </div>
            <FileUploadTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2 w-fit">
                Browse files
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>

          <FileUploadList>
            {files.map((file, index) => {
              const uploadedFile = uploadedFiles.find(
                (uf) => uf.name === file.name && uf.size === file.size
              );
              const isDeleting = uploadedFile
                ? deletingFiles.has(uploadedFile.key)
                : false;

              return (
                <FileUploadItem key={index} value={file}>
                  <div className="flex w-full items-center gap-2">
                    <FileUploadItemPreview />
                    <FileUploadItemMetadata />
                    <FileUploadItemDelete asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleFileDelete(file, index)}
                        disabled={isUploading || isAnalyzing || isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X />
                        )}
                      </Button>
                    </FileUploadItemDelete>
                  </div>
                  <FileUploadItemProgress />
                </FileUploadItem>
              );
            })}
          </FileUploadList>
        </FileUpload>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="font-medium text-sm">
              Uploaded files ready for analysis
            </p>
            <div className="flex items-center gap-2 overflow-x-auto">
              {uploadedFiles.map((file) => (
                <div key={file.key} className="relative group">
                  <div className="relative size-20 flex-shrink-0">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      sizes="80px"
                      className="aspect-square rounded-md object-cover"
                    />
                    {deletingFiles.has(file.key) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {file.name.length > 15
                        ? `${file.name.slice(0, 15)}...`
                        : file.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <Button
            onClick={analyzeImages}
            disabled={isAnalyzing || isUploading || deletingFiles.size > 0}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Images & Getting Nutrition Data...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Analyze Food & Get Nutrition Info
              </>
            )}
          </Button>
        )}

        {analysisResult && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Analysis Results
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Total Nutrition Summary */}
            {analysisResult.totalNutrition && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800">
                    Total Nutritional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {Math.round(analysisResult.totalNutrition.calories)}
                      </div>
                      <div className="text-sm text-green-600">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-blue-700">
                        {formatNutrientValue(
                          analysisResult.totalNutrition.protein
                        )}
                      </div>
                      <div className="text-sm text-blue-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-orange-700">
                        {formatNutrientValue(
                          analysisResult.totalNutrition.carbs
                        )}
                      </div>
                      <div className="text-sm text-orange-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-yellow-700">
                        {formatNutrientValue(analysisResult.totalNutrition.fat)}
                      </div>
                      <div className="text-sm text-yellow-600">Fat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-purple-700">
                        {formatNutrientValue(
                          analysisResult.totalNutrition.fiber
                        )}
                      </div>
                      <div className="text-sm text-purple-600">Fiber</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-red-700">
                        {formatNutrientValue(
                          analysisResult.totalNutrition.sodium,
                          "mg"
                        )}
                      </div>
                      <div className="text-sm text-red-600">Sodium</div>
                    </div>
                  </div>
                </CardContent>
                <Button className="justify-items-center w-90">
                  Add to profile
                </Button>
              </Card>
            )}

            {/* Image Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Image Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {analysisResult.description}
                </p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </div>
              </CardContent>
            </Card>

            {/* Individual Dishes */}
            {analysisResult.dishes && analysisResult.dishes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Individual Dishes</h4>
                {analysisResult.dishes.map((dish, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base capitalize">
                          {dish.name}
                        </CardTitle>
                        <Badge variant="outline">{dish.servingSize}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dish.nutrition ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-semibold text-green-700">
                                {Math.round(dish.nutrition.nf_calories)}
                              </div>
                              <div className="text-xs text-green-600">
                                Calories
                              </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                              <div className="text-sm font-semibold text-blue-700">
                                {formatNutrientValue(dish.nutrition.nf_protein)}
                              </div>
                              <div className="text-xs text-blue-600">
                                Protein
                              </div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg text-center">
                              <div className="text-sm font-semibold text-orange-700">
                                {formatNutrientValue(
                                  dish.nutrition.nf_total_carbohydrate
                                )}
                              </div>
                              <div className="text-xs text-orange-600">
                                Carbs
                              </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg text-center">
                              <div className="text-sm font-semibold text-yellow-700">
                                {formatNutrientValue(
                                  dish.nutrition.nf_total_fat
                                )}
                              </div>
                              <div className="text-xs text-yellow-600">Fat</div>
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Fiber:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNutrientValue(
                                  dish.nutrition.nf_dietary_fiber
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Sugar:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNutrientValue(dish.nutrition.nf_sugars)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Sodium:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNutrientValue(
                                  dish.nutrition.nf_sodium,
                                  "mg"
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Cholesterol:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatNutrientValue(
                                  dish.nutrition.nf_cholesterol,
                                  "mg"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Serving: {dish.nutrition.serving_qty}{" "}
                            {dish.nutrition.serving_unit}(
                            {dish.nutrition.serving_weight_grams}g)
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Alert className="border-amber-200 bg-amber-50">
                            <AlertDescription className="text-amber-800">
                              {dish.error ||
                                "Nutrition data not available for this dish"}
                            </AlertDescription>
                          </Alert>
                          <div className="text-xs text-muted-foreground">
                            Try searching for "{dish.name}" manually in
                            nutrition apps like MyFitnessPal for detailed
                            information.
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Ingredients Found */}
            {analysisResult.objects && analysisResult.objects.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Ingredients Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.objects.map((object, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {object}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Suggestions */}
            {analysisResult.totalNutrition &&
              analysisResult.totalNutrition.calories > 0 && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Activity Suggestions to Burn Calories
                    </CardTitle>
                    <CardDescription className="text-purple-600">
                      Approximate time needed to burn{" "}
                      {Math.round(analysisResult.totalNutrition.calories)}{" "}
                      calories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-purple-700">
                          {Math.round(
                            analysisResult.totalNutrition.calories / 10
                          )}{" "}
                          min
                        </div>
                        <div className="text-sm text-purple-600">Running</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-purple-700">
                          {Math.round(
                            analysisResult.totalNutrition.calories / 8
                          )}{" "}
                          min
                        </div>
                        <div className="text-sm text-purple-600">Cycling</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-purple-700">
                          {Math.round(
                            analysisResult.totalNutrition.calories / 6
                          )}{" "}
                          min
                        </div>
                        <div className="text-sm text-purple-600">Walking</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-lg font-semibold text-purple-700">
                          {Math.round(
                            analysisResult.totalNutrition.calories / 12
                          )}{" "}
                          min
                        </div>
                        <div className="text-sm text-purple-600">Swimming</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

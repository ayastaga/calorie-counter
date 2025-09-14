// /src/app/components/add-to-profile-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Save, Utensils } from "lucide-react";
import { toast } from "sonner";

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
  uploadedImages?: Array<{
    url: string;
    key: string;
    name: string;
  }>;
}

interface AddToProfileDialogProps {
  analysisResult: AnalysisResult;
  onSave: () => void;
  imageSpecific?: boolean;
  imageName?: string;
}

export function AddToProfileDialog({
  analysisResult,
  onSave,
  imageSpecific = false,
  imageName,
}: AddToProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [description, setDescription] = useState(
    analysisResult.description || ""
  );

  const formatNutrientValue = (value: number, unit: string = "g") => {
    return `${Math.round(value * 10) / 10}${unit}`;
  };

  const handleSave = async () => {
    if (!mealName.trim()) {
      toast.error("Please enter a meal name");
      return;
    }

    if (!analysisResult.totalNutrition) {
      toast.error("No nutrition data available to save");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = analysisResult.uploadedImages?.[0]?.url || "";

      const mealData = {
        mealName: mealName.trim(),
        mealType,
        imageUrl,
        description: description.trim(),
        totalNutrition: analysisResult.totalNutrition,
        dishes: analysisResult.dishes || [],
      };

      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save meal");
      }

      const result = await response.json();

      toast.success("Meal saved to profile!", {
        description: `${mealName} has been added to your nutrition log`,
      });

      setOpen(false);
      setMealName("");
      setDescription(analysisResult.description || "");
      onSave();
    } catch (error) {
      console.error("Error saving meal:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save meal";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!analysisResult.totalNutrition) {
    return null; // Don't show the button if there's no nutrition data
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          {imageSpecific
            ? `Add ${imageName ? `"${imageName}"` : "This Image"} to Profile`
            : "Add to Profile"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {imageSpecific
              ? `Save ${imageName || "Image"} to Profile`
              : "Save Meal to Profile"}
          </DialogTitle>
          <DialogDescription>
            {imageSpecific
              ? `Add this specific image analysis to your nutrition log`
              : "Add this meal analysis to your nutrition tracking profile"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meal Details Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Meal Name *</Label>
              <Input
                id="meal-name"
                placeholder={
                  imageSpecific
                    ? `Enter name for ${imageName || "this meal"}...`
                    : "Enter meal name..."
                }
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about this meal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Nutrition Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Nutrition Summary
                {imageSpecific && (
                  <Badge variant="outline" className="text-xs">
                    {imageName || "Single Image"}
                  </Badge>
                )}
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
                    {formatNutrientValue(analysisResult.totalNutrition.protein)}
                  </div>
                  <div className="text-sm text-blue-600">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-orange-700">
                    {formatNutrientValue(analysisResult.totalNutrition.carbs)}
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
                    {formatNutrientValue(analysisResult.totalNutrition.fiber)}
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
          </Card>

          {/* Individual Dishes Preview */}
          {analysisResult.dishes && analysisResult.dishes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Dishes to Save ({analysisResult.dishes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.dishes.map((dish, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {dish.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dish.servingSize}
                          {dish.nutrition &&
                            ` • ${Math.round(dish.nutrition.nf_calories)} cal`}
                        </p>
                      </div>
                      <Badge
                        variant={dish.nutrition ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {dish.nutrition ? "✓ Nutrition" : "No data"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !mealName.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save to Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

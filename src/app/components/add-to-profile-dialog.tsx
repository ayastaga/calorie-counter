// components/add-to-profile-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  description: string;
  confidence: number;
  objects?: string[];
  text?: string;
  dishes?: {
    name: string;
    servingSize: string;
    nutrition?: any;
    error?: string;
  }[];
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

interface AddToProfileDialogProps {
  analysisResult: AnalysisResult;
  onSave: () => void;
}

export function AddToProfileDialog({
  analysisResult,
  onSave,
}: AddToProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    mealName: "",
    mealType: "other",
    description: analysisResult.description || "",
    imageUrl: "",
  });

  const handleSave = async () => {
    if (!formData.mealName.trim()) {
      toast.error("Please enter a meal name");
      return;
    }

    if (!analysisResult.totalNutrition) {
      toast.error("No nutrition data available to save");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealName: formData.mealName,
          mealType: formData.mealType,
          description: formData.description,
          imageUrl: formData.imageUrl,
          totalNutrition: analysisResult.totalNutrition,
          dishes: analysisResult.dishes || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save meal");
      }

      const result = await response.json();

      toast.success("Meal saved to profile!", {
        description: `"${formData.mealName}" has been added to your nutrition tracking.`,
      });

      setIsOpen(false);
      onSave(); // Clear the analysis results

      // Reset form
      setFormData({
        mealName: "",
        mealType: "other",
        description: analysisResult.description || "",
        imageUrl: "",
      });
    } catch (error) {
      console.error("Error saving meal:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save meal";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const generateMealName = () => {
    const dishes = analysisResult.dishes?.map((d) => d.name).join(", ");
    if (dishes) {
      setFormData((prev) => ({ ...prev, mealName: dishes }));
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      // Optionally reset the form when the dialog is closed
      setFormData({
        mealName: "",
        mealType: "other",
        description: analysisResult.description || "",
        imageUrl: "",
      });
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Add to Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save to Nutrition Profile</DialogTitle>
          <DialogDescription>
            Add this meal to your nutrition tracking profile. You can customize
            the details before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meal Name */}
          <div className="space-y-2">
            <Label htmlFor="mealName">Meal Name *</Label>
            <div className="flex gap-2">
              <Input
                id="mealName"
                placeholder="Enter meal name..."
                value={formData.mealName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mealName: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateMealName}
                disabled={!analysisResult.dishes?.length}
                title="Auto-generate from detected dishes"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type</Label>
            <Select
              value={formData.mealType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, mealType: value }))
              }
            >
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

          {/* Image URL (readonly, from uploaded file) */}
          {formData.imageUrl && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Attached Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  readOnly
                  className="bg-muted"
                />
                <div className="text-sm text-muted-foreground">📷</div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add any notes about this meal..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          {/* Nutrition Summary */}
          {analysisResult.totalNutrition && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Nutrition Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.calories)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.protein)}g
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.carbs)}g
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fat:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.fat)}g
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fiber:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.fiber)}g
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sodium:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(analysisResult.totalNutrition.sodium)}mg
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.mealName.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Save to Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

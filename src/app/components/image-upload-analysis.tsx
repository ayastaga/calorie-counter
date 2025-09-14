"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { toast } from "sonner";
import { UploadThingError } from "uploadthing/server";
import { AddToProfileDialog } from "./add-to-profile-dialog";

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
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());

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
      
      // Expand the first image by default
      if (result.images && result.images.length > 0) {
        setExpandedImages(new Set([result.images[0].imageKey]));
      }
      
      setUploadedFiles([]);
      setFiles([]);

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
    setExpandedImages(new Set());
  };

  const toggleImageExpanded = (imageKey: string) => {
    setExpandedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageKey)) {
        newSet.delete(imageKey);
      } else {
        newSet.add(imageKey);
      }
      return newSet;
    });
  };

  const formatNutrientValue = (value: number, unit: string = "g") => {
    return `${Math.round(value * 10) / 10}${unit}`;
  };
}
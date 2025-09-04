import { Shell } from "@/components/shell";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUploadDemo } from "./components/file-upload-demo";
import { FileUploadFormDemo } from "./components/file-upload-form-demo";
import { FileUploadUploadThingDemo } from "./components/file-upload-uploadthing-demo";
import ImageUploadAnalysisCard from "./components/image-upload-analysis";

export default function IndexPage() {
  return (
    <Shell className="max-w-2xl">
      <ImageUploadAnalysisCard/>
    </Shell>
  );
}

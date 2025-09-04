// /src/lib/uploadthing.ts
import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react/hooks";
import { generateComponents } from "@uploadthing/react";

import type { OurFileRouter } from "~/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { uploadFiles } = generateReactHelpers<OurFileRouter>();

export const { UploadButton: UTUploadButton, UploadDropzone: UTUploadDropzone } =
  generateComponents<OurFileRouter>();

// /src/lib/uploadthing.ts
import {
  generateReactHelpers,
} from "@uploadthing/react/hooks";

import type { OurFileRouter } from "../app/api/uploadthing/core";

export const { uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing", // Explicitly set the URL
});

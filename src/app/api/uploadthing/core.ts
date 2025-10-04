// /src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      console.log("UploadThing middleware running");

      // Return any data you want to pass to onUploadComplete
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for:", metadata.uploadedBy);
      console.log("File URL:", file.ufsUrl);

      // Return anything you want to send back to the client
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

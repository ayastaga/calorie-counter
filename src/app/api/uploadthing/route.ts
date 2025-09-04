// /src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Image uploader for AI analysis
  imageUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 5 // Allow up to 5 images
    } 
  })
    .middleware(async ({ req }) => {
      // Add any authentication logic here if needed
      // For now, we'll allow all uploads
      
      // You could add user authentication like:
      // const user = await auth(req);
      // if (!user) throw new UploadThingError("Unauthorized");
      
      console.log("Processing upload in middleware");
      
      return { 
        uploadedBy: "anonymous", // You can replace this with actual user ID
        purpose: "ai-analysis" 
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Upload complete for:", metadata.uploadedBy);
      console.log("File URL:", file.url);
      console.log("File size:", file.size);
      console.log("File key:", file.key);
      
      // You could store file info in your database here if needed
      // await db.image.create({
      //   data: {
      //     url: file.url,
      //     key: file.key,
      //     uploadedBy: metadata.uploadedBy,
      //   }
      // });
      
      // Return success data
      return { 
        success: true,
        fileUrl: file.url,
        fileKey: file.key 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// /src/app/api/delete-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

// Initialize UTApi for file deletion
const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey } = body as { fileKey: string };

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    try {
      // Delete the file from UploadThing
      await utapi.deleteFiles([fileKey]);
      console.log(`Successfully deleted file with key: ${fileKey}`);
      
      return NextResponse.json(
        { success: true, message: 'File deleted successfully' },
        { status: 200 }
      );
    } catch (deleteError) {
      console.error(`Failed to delete file with key ${fileKey}:`, deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'File deletion API is running. Use POST method to delete files.' },
    { status: 405 }
  );
}

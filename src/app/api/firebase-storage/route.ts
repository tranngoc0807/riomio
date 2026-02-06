import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
} from "firebase/storage";

// Helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, filePath);
    await getMetadata(fileRef);
    return true;
  } catch {
    return false;
  }
}

// Helper function to get unique filename
async function getUniqueFileName(folder: string, baseName: string, extension: string): Promise<string> {
  let fileName = `${baseName}.${extension}`;
  let filePath = folder ? `${folder}/${fileName}` : fileName;
  let counter = 1;

  while (await fileExists(filePath)) {
    fileName = `${baseName}-${counter}.${extension}`;
    filePath = folder ? `${folder}/${fileName}` : fileName;
    counter++;
  }

  return fileName;
}

/**
 * POST /api/firebase-storage
 * Upload image to Firebase Storage and return public URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) ?? "";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Get custom name or generate unique filename
    const customName = (formData.get("customName") as string)?.trim();
    const extension = file.name.split(".").pop() || "jpg";

    let fileName: string;
    if (customName) {
      // Use custom name, check for duplicates
      fileName = await getUniqueFileName(folder, customName, extension);
    } else {
      // Auto generate unique name
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      fileName = `${timestamp}-${randomStr}.${extension}`;
    }
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({
      success: true,
      url: downloadURL,
      path: filePath,
      fileName: fileName,
    });
  } catch (error: unknown) {
    console.error("Error uploading to Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/firebase-storage?folder=images
 * List all images in a folder from Firebase Storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") ?? "";

    // For root folder, use empty string; for subfolders, use the folder name
    const listRef = ref(storage, folder);
    const result = await listAll(listRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url: url,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: files,
      total: files.length,
    });
  } catch (error: unknown) {
    console.error("Error listing Firebase files:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to list files";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/firebase-storage
 * Delete an image from Firebase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: "File path is required" },
        { status: 400 }
      );
    }

    const fileRef = ref(storage, path);
    await deleteObject(fileRef);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting Firebase file:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

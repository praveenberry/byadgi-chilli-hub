import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file received." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB." },
        { status: 400 }
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Use JPG, PNG or WebP images only." },
        { status: 400 }
      );
    }

    const fileName = `product-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    await fs.writeFile(
      path.join(uploadDir, fileName),
      buffer
    );

    return NextResponse.json({
      imageUrl: `/uploads/products/${fileName}`,
    });
  } catch (error) {
    console.error("Product image upload:", error);

    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }
}
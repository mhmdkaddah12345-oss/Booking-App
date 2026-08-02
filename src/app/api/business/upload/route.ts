import { NextRequest, NextResponse } from "next/server";
import { uploadBusinessImage, setHeroImage, addGalleryPhoto } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof Blob) || (kind !== "hero" && kind !== "gallery")) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }

  const { url, path } = await uploadBusinessImage(auth.businessId, kind, file, extension);

  if (kind === "hero") {
    await setHeroImage(auth.businessId, url, path);
    return NextResponse.json({ url }, { status: 201 });
  }

  const photo = await addGalleryPhoto(auth.businessId, url, path);
  return NextResponse.json({ photo }, { status: 201 });
}

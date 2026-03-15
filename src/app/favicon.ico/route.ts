import { readFileSync } from "fs";
import { join } from "path";

import { NextResponse } from "next/server";

export async function GET() {
  const filePath = join(process.cwd(), "public", "favicon.ico");
  const buffer = readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

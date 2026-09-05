import { NextResponse } from "next/server";

// POST /api/enhance
// Receives a FormData upload with fields:
// - file: File (image)
// - quality: string (4k|8k|portrait)
//
// Behavior:
// - If ENHANCEMENT_API_URL and ENHANCEMENT_API_KEY are set in the environment, forward the file (as form-data)
//   to that endpoint and return whatever it returns (expected JSON with an `enhancedImage` field or `enhancedImageUrl`).
// - Otherwise returns a fallback response that echoes back the original image as `enhancedImage` (data URL).

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const quality = (form.get("quality") as string) || "default";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file into base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    // If an external enhancement API is configured, proxy the request
    const endpoint = process.env.ENHANCEMENT_API_URL;
    const apiKey = process.env.ENHANCEMENT_API_KEY;

    if (endpoint && apiKey) {
      // Forward the original file (as form-data) and quality to the external service.
      const forward = new FormData();
      // Some external endpoints expect a binary file; FormData accepts a Blob-like object
      forward.append("file", new Blob([arrayBuffer], { type: file.type }), (file as File).name || "upload.jpg");
      forward.append("quality", quality);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: forward,
      });

      const contentType = res.headers.get("content-type") || "";

      // If the external service returned an image binary, convert it to a data URL and return.
      if (contentType.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer());
        const returnedDataUrl = `data:${contentType};base64,${buf.toString("base64")}`;
        return NextResponse.json({ enhancedImage: returnedDataUrl });
      }

      // Otherwise assume JSON
      const json = await res.json();
      // Standardize common responses: if upstream returns a URL, return it; if base64, return it.
      if (json.enhancedImage) {
        return NextResponse.json({ enhancedImage: json.enhancedImage });
      }
      if (json.enhancedImageUrl) {
        return NextResponse.json({ enhancedImageUrl: json.enhancedImageUrl });
      }

      // Unknown upstream shape — return full upstream response for debugging
      return NextResponse.json({ forwarded: json });
    }

    // No external API configured — return the original image as "enhanced" so the frontend can continue working
    return NextResponse.json({ enhancedImage: dataUrl, info: "No ENHANCEMENT_API_URL configured; returned original image as fallback." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { client } from "@gradio/client";

// POST /api/enhance
// Receives a FormData upload with fields:
// - file: File (image)
// - quality: string (4k|8k|portrait)
//
// Uses Hugging Face Gradio endpoints:
// - CodeFormer (face restoration) with fidelity weight 0.95
// - Real-ESRGAN (image upscaling)
//
// Behavior:
// - For "portrait" quality: applies CodeFormer with fidelity 0.95 for face restoration
// - For "4k" quality: applies Real-ESRGAN for 4x upscaling
// - For "8k" quality: applies Real-ESRGAN for 4x upscaling with enhancement

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const quality = (form.get("quality") as string) || "4k";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file into base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    let enhancedImage: string;

    try {
      if (quality === "portrait") {
        // Use CodeFormer for face restoration with fidelity 0.95
        enhancedImage = await enhanceWithCodeFormer(dataUrl);
      } else if (quality === "4k") {
        // Use Real-ESRGAN for 4x upscaling
        enhancedImage = await enhanceWithRealESRGAN(dataUrl, 4);
      } else if (quality === "8k") {
        // Use Real-ESRGAN for 4x upscaling with enhancement
        enhancedImage = await enhanceWithRealESRGAN(dataUrl, 4);
      } else {
        enhancedImage = dataUrl;
      }

      return NextResponse.json({ enhancedImage });
    } catch (apiError: any) {
      console.error("Gradio API error:", apiError);
      // Fallback: return original image if API fails
      return NextResponse.json({
        enhancedImage: dataUrl,
        warning: `Enhancement API unavailable: ${apiError?.message || "Unknown error"}. Returned original image.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

async function enhanceWithCodeFormer(imageDataUrl: string): Promise<string> {
  try {
    // Public CodeFormer Gradio space: https://huggingface.co/spaces/sczhou/CodeFormer
    const app = await client("https://sczhou-codeformer.hf.space/");

    // CodeFormer endpoint: predict
    // Parameters: (image, fidelity_weight, bg_upsampler, aligned, only_center_face, ext)
    // fidelity_weight: 0.95 (to preserve facial identity and bone structure)
    const result = await app.predict("/predict", [
      imageDataUrl, // image
      0.95, // fidelity_weight (0 = identity preserved, 1 = quality)
      "None", // bg_upsampler
      false, // aligned
      true, // only_center_face
      "png", // ext
    ]);

    // Result should contain the enhanced image
    if (result && result.data && result.data[0]) {
      return result.data[0];
    }

    throw new Error("Unexpected CodeFormer response format");
  } catch (error) {
    console.error("CodeFormer enhancement failed:", error);
    throw error;
  }
}

async function enhanceWithRealESRGAN(imageDataUrl: string, scale: number): Promise<string> {
  try {
    // Public Real-ESRGAN Gradio space: https://huggingface.co/spaces/philz/RealESRGAN
    const app = await client("https://philz-realesrgan.hf.space/");

    // Real-ESRGAN endpoint: predict
    // Parameters: (image, upscale_factor, face_enhance, tile_size, denoise_strength)
    const result = await app.predict("/predict", [
      imageDataUrl, // image
      scale, // upscale factor (2, 3, 4)
      true, // face_enhance
      400, // tile_size
      0.5, // denoise_strength
    ]);

    // Result should contain the enhanced image
    if (result && result.data && result.data[0]) {
      return result.data[0];
    }

    throw new Error("Unexpected Real-ESRGAN response format");
  } catch (error) {
    console.error("Real-ESRGAN enhancement failed:", error);
    throw error;
  }
}

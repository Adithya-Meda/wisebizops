import { NextResponse } from "next/server";
import { parseTerraformDeterministically } from "@/lib/terraform-parser";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    
    const text = await file.text();
    const parsedResources = parseTerraformDeterministically(text);
    
    return NextResponse.json({
      success: true,
      resourcesDetected: parsedResources
    });
  } catch (error) {
    console.error("TF Parse API Error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Failed to parse tf file" }, { status: 400 });
  }
}


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Analyzing K8s payload in memory without saving...");
    
    return NextResponse.json({
      success: true,
      analysis: "Simulated analysis: Pod crashed due to OOMKilled limit exceeded.",
      recommendation: "Increase the memory limit in the deployment YAML from 256Mi to 512Mi."
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to parse logs" }, { status: 400 });
  }
}

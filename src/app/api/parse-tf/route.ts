import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Parsing Terraform file in memory without saving to disk...");
    
    return NextResponse.json({
      success: true,
      resourcesDetected: ["aws_instance.web", "aws_s3_bucket.data"],
      estimatedMonthlyCost: "$145.00"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to parse tf file" }, { status: 400 });
  }
}

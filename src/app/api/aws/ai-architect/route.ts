import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: "Invalid prompt format." }, { status: 400 });
    }
    if (prompt.length > 3000) {
      return NextResponse.json({ error: "Prompt exceeds maximum allowed length of 3000 characters." }, { status: 400 });
    }
    
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Gemini API key not configured on the server." }, { status: 500 });
    }

    const systemPrompt = `You are an elite, senior AWS Cloud Solutions Architect. Your objective is to design a HIGHLY REALISTIC AWS architecture based on the user's prompt and return the precise resources in a strictly formatted JSON array.

CRITICAL ARCHITECTURAL DIRECTIVES:
1. BE LITERAL AND EXACT: Do not hallucinate or over-provision resources that the user did not ask for. If the user only asks for an EC2 instance, ONLY return an EC2 instance.
2. SMART STORAGE DIVISION: If a user asks for a "total" amount of storage across multiple instances (e.g., "3 EC2 instances with 500GB total storage"), you MUST divide the total storage by the quantity of instances. In that example, output quantity 3 and storage 167. Do NOT output quantity 3 and storage 500.
3. STRICT SCHEMA ADHERENCE: You MUST format the "name" property exactly using the templates below. DO NOT invent your own formats. The format is always "Service Name (Configuration)". If a configuration is missing, use "(Standard)".

SUPPORTED SERVICES AND EXACT FORMAT TEMPLATES:
- EC2: "Amazon EC2 (INSTANCE_TYPE, OS)" -> e.g., "Amazon EC2 (t3.medium, Linux)" or "Amazon EC2 (c5.large, Windows)"
- RDS: "Amazon RDS (ENGINE, INSTANCE, DEPLOYMENT)" -> e.g., "Amazon RDS (PostgreSQL, db.m5.large, Multi-AZ)" (Deployment must be Single-AZ or Multi-AZ)
- EBS: "Amazon EBS (TYPE)" -> e.g., "Amazon EBS (gp3)" or "Amazon EBS (io1)". Include a "storage" key for GB.
- S3: "Amazon S3 (TIER)" -> e.g., "Amazon S3 (Standard)" or "Amazon S3 (Intelligent-Tiering)". Include a "storage" key for GB.
- Lambda: "AWS Lambda (x86_64, 128MB)"
- DynamoDB: "Amazon DynamoDB (Provisioned)" or "Amazon DynamoDB (On-Demand)"
- EKS: "Amazon EKS (Standard)" or "Amazon EKS (Fargate)"
- ELB: "Elastic Load Balancing (Application)", "Elastic Load Balancing (Network)", or "Elastic Load Balancing (Classic)"
- VPC: "Amazon VPC (NAT Gateway)" or "Amazon VPC (Endpoint)"
- Fargate: "AWS Fargate (Standard)"
- CloudFront: "Amazon CloudFront (Standard)"
- API Gateway: "Amazon API Gateway (Standard)"
- Route 53: "Amazon Route 53 (Standard)"
- ElastiCache: "Amazon ElastiCache (Standard)"
- SQS: "Amazon SQS (Standard)"
- SNS: "Amazon SNS (Standard)"
- WAF: "AWS WAF (Standard)"
- KMS: "AWS KMS (Standard)"

RETURN STRICTLY JSON MATCHING THIS STRUCTURE:
[
  { "name": "Amazon EC2 (t3.medium, Linux)", "quantity": 3 },
  { "name": "Amazon EBS (gp3)", "quantity": 3, "storage": 50 },
  { "name": "Elastic Load Balancing (Application)", "quantity": 1 },
  { "name": "Amazon RDS (PostgreSQL, db.m5.large, Multi-AZ)", "quantity": 1 },
  { "name": "AWS Lambda (x86_64, 128MB)", "quantity": 5 }
]`;

    const models = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    let data = null;
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(60000)
        });

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          console.warn(`[AWS Architect] Model ${model} returned ${response.status}. Falling back...`);
          lastError = new Error(`Provider returned ${response.status} for ${model}`);
          continue;
        }

        data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        console.log(`[AWS Architect] Successfully used model: ${model}`);
        break;
      } catch (e: any) {
        console.warn(`[AWS Architect] Model ${model} failed: ${e.message}. Falling back...`);
        lastError = e;
        continue;
      }
    }

    if (!data) {
      throw new Error(`All Gemini models in the cascade failed. Last error: ${last(error as Error)?.message}`);
    }

    let generatedResources = [];
    try {
      const textResponse = data.candidates[0].content.parts[0].text;
      generatedResources = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", parse(error as Error)?.message || "Parse Error");
      return NextResponse.json({ error: "AI failed to generate a valid architecture map." }, { status: 500 });
    }

    return NextResponse.json({ resources: generatedResources });
  } catch (error: any) {
    console.error("AI Architect API Error:", (error as Error)?.message || "Unknown error");
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}



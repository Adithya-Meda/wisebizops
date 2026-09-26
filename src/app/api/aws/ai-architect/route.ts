import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (per instance)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS) {
    return true;
  }
  record.count++;
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute before trying again." }, { status: 429 });
    }

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

    const systemPrompt = `You are an elite, senior AWS Cloud Solutions Architect. The user will describe a business requirement, application architecture, or provide Terraform configurations.
Your objective is to design a HIGHLY REALISTIC, PRODUCTION-READY AWS architecture and return the precise resources required in a strictly formatted JSON array.

CRITICAL ARCHITECTURAL DIRECTIVES:
1. INCLUDE ALL DEPENDENT RESOURCES: Do not leave the user with an incomplete architecture. If you provision EC2 instances, you MUST provision their dependent Amazon EBS storage volumes. If you provision a highly-available web tier, you MUST include an Elastic Load Balancing (ALB/NLB) resource. If you provision private subnets, consider Amazon VPC (NAT Gateway).
2. REALISTIC SIZING: Provision quantities and instance classes (e.g., t3.medium, c5.large, db.r5.large) that logically match the user's scale, traffic, and redundancy requirements (e.g., Multi-AZ).
3. SECURITY SERVICES (WAF, KMS): ONLY provision AWS WAF or AWS KMS if the user explicitly mentions security, encryption, firewalls, or compliance. Do not automatically append them to generic architectures.
4. STRICT SCHEMA ADHERENCE: You must ONLY output services from the exact list below.

ALLOWED SERVICES:
"Amazon EC2", "Amazon RDS", "Amazon S3", "Amazon EBS", "Elastic Load Balancing", "Amazon VPC", "AWS Lambda", "Amazon DynamoDB", "Amazon EKS", "Amazon ECS", "Amazon CloudFront", "Amazon API Gateway", "Amazon ElastiCache", "Amazon SQS", "Amazon SNS", "Amazon Route 53", "AWS Fargate", "AWS WAF", "AWS KMS"

CONFIG EXAMPLES: 
- EC2: "Amazon EC2 (t3.medium, Linux)"
- EBS: "Amazon EBS (gp3)" with an added "storage" key for GB size.
- RDS: "Amazon RDS (db.m5.large, PostgreSQL)"
- ELB: "Elastic Load Balancing (Application)"

RETURN STRICTLY JSON MATCHING THIS STRUCTURE:
[
  { "name": "Amazon EC2 (t3.medium, Linux)", "quantity": 3 },
  { "name": "Amazon EBS (gp3)", "quantity": 3, "storage": 50 },
  { "name": "Elastic Load Balancing (Application)", "quantity": 1 },
  { "name": "Amazon RDS (db.m5.large, PostgreSQL)", "quantity": 1 }
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
            contents: [
              { role: "user", parts: [{ text: systemPrompt + "\n\nUser Architecture:\n" + prompt }] }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(60000) // 60-second timeout to allow long K8s log processing
        });

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          console.warn(`[AWS Architect] Model ${model} returned ${response.status}. Falling back...`);
          lastError = new Error(`Provider returned ${response.status} for ${model}`);
          continue; // Try next model in cascade
        }

        data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        console.log(`[AWS Architect] Successfully used model: ${model}`);
        break; // Success! Break out of the cascade.
      } catch (e: any) {
        console.warn(`[AWS Architect] Model ${model} failed: ${e.message}. Falling back...`);
        lastError = e;
        continue;
      }
    }

    if (!data) {
      throw new Error(`All Gemini models in the cascade failed. Last error: ${lastError?.message}`);
    }

    let generatedResources = [];
    try {
      const textResponse = data.candidates[0].content.parts[0].text;
      generatedResources = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON", parseError);
      return NextResponse.json({ error: "AI failed to generate a valid architecture map." }, { status: 500 });
    }

    return NextResponse.json({ resources: generatedResources });
  } catch (error: any) {
    console.error("AI Architect API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { scrubPII } from '@/utils/security';

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    
    if (!logs || typeof logs !== 'string') {
      return NextResponse.json({ error: "Invalid logs format." }, { status: 400 });
    }
    if (logs.length > 10000) {
      return NextResponse.json({ error: "Logs exceed maximum allowed length of 10000 characters. Please truncate the output." }, { status: 400 });
    }
    
    // Scrub PII before sending to AI
    const safeLogs = scrubPII(logs);
    
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Gemini API key not configured on the server." }, { status: 500 });
    }

    const systemPrompt = `You are a Senior Kubernetes Administrator. The user will provide raw output from 'kubectl describe pod' or pod logs.
Your goal is to parse these logs and identify the root cause of any failures (e.g., OOMKilled, CrashLoopBackOff, ImagePullBackOff, RBAC errors).
\nCRITICAL SAFEGUARDS:\n- DO NOT provide dangerous, destructive, or hallucinated remediation commands.\n- Ensure any 'kubectl' commands or yaml configurations provided in the remediation are perfectly safe, syntactically correct, and follow standard production Kubernetes best practices.\n- Do not guess if you are unsure. State clearly if the logs do not provide enough context.\nReturn a strictly formatted JSON object with exactly these keys:
{
  "rootCause": "A short 3-6 word title of the main issue",
  "description": "A 1-2 sentence explanation of what exactly went wrong based on the logs.",
  "remediation": "A clear, actionable step to fix it (can include markdown yaml blocks or bash commands).",
  "confidence": "A percentage (e.g. '95%') indicating how certain you are."
}
Do not return any text outside of the JSON block.`;

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
              { role: "user", parts: [{ text: safeLogs }] }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(60000)
        });

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          console.warn(`[K8s Analyzer] Model ${model} returned ${response.status}. Falling back...`);
          lastError = new Error(`Provider returned ${response.status} for ${model}`);
          continue;
        }

        data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        console.log(`[K8s Analyzer] Successfully used model: ${model}`);
        break;
      } catch (e: any) {
        console.warn(`[K8s Analyzer] Model ${model} failed: ${e.message}. Falling back...`);
        lastError = e;
        continue;
      }
    }

    if (!data) {
      throw new Error(`All Gemini models in the cascade failed. Last error: ${(lastError as Error)?.message}`);
    }

    let generatedDiagnosis = null;
    try {
      const textResponse = data.candidates[0].content.parts[0].text;
      generatedDiagnosis = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", (parseError as Error)?.message || "Parse Error");
      return NextResponse.json({ error: "AI failed to generate a valid diagnosis." }, { status: 500 });
    }

    return NextResponse.json({ diagnosis: generatedDiagnosis });
  } catch (error: any) {
    console.error("K8s Analyzer API Error:", (error as Error)?.message || "Unknown error");
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}




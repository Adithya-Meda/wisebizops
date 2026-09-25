import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 1. Security Check: Strict CORS Enforcement
    const origin = req.headers.get('origin');
    const allowedDomains = ['https://tools.wisebiz.online', 'http://localhost:3000'];
    
    if (origin && !allowedDomains.includes(origin)) {
      console.warn("Blocked unauthorized cross-origin request from:", origin);
      return NextResponse.json({ error: "Unauthorized Traffic" }, { status: 403 });
    }

    // 2. Data Privacy & Parsing
    const body = await req.json();
    const region = body?.region;
    const resources = body?.resources;

    // 3. Enterprise Compliance: Strict Input Validation & Anti-DoS Protection
    if (!Array.isArray(resources)) {
      return NextResponse.json({ error: "Invalid payload format. Resources must be an array." }, { status: 400 });
    }
    
    if (resources.length > 50) {
      return NextResponse.json({ error: "Payload too large. Maximum 50 resources allowed per request." }, { status: 413 });
    }

    if (typeof region !== 'string' || region.length > 20) {
      return NextResponse.json({ error: "Invalid region parameter." }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
    }

    // Default exchange rates (could also be stored in DB later)
    const exchangeRates = { EUR: 0.92, GBP: 0.79, INR: 83.5 };

    let total = 0;
    const breakdown = [];

    for (const res of resources) {
      let resStr = typeof res === 'object' ? res.name : res;
      let quantity = typeof res === 'object' ? (res.quantity || 1) : 1;
      let storage = typeof res === 'object' ? (res.storage || 1) : 1;

      const match = resStr.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
      if (!match) {
        breakdown.push({ service: resStr, cost: 50 * quantity, quantity, storage });
        total += 50 * quantity;
        continue;
      }

      const serviceName = match[1].trim();
      let primaryConfig = match[2] ? match[2] : "Standard";

      // Query Supabase
      const { data, error } = await supabase
        .from('aws_prices')
        .select('price_usd')
        .eq('service_name', serviceName)
        .eq('region', region)
        .eq('configuration', primaryConfig)
        .single();

      let unitCost = 15; // default fallback
        if (error) console.error("Supabase Error for ${serviceName}: ", error);
      if (data && !error) {
        unitCost = parseFloat(data.price_usd);
      } else {
        // Fallback query without region if not found
        const { data: fallbackData } = await supabase
          .from('aws_prices')
          .select('price_usd')
          .eq('service_name', serviceName)
          .eq('configuration', primaryConfig)
          .limit(1)
          .single();
        if (fallbackData) {
          unitCost = parseFloat(fallbackData.price_usd);
        }
      }

      let cost = unitCost * quantity;
      
      // Handle storage math correctly depending on the service type
      if (serviceName.includes("S3") || serviceName.includes("EBS") || serviceName.includes("EFS")) {
         // Storage services: unit cost is per TB. Convert input GB to TB.
         const storageInTB = storage / 1000;
         cost = unitCost * quantity * storageInTB;
      } else if (storage > 1) {
         // Compute services (RDS, etc): compute is separate from storage. Add storage as .10/GB flat fee.
         cost = (unitCost * quantity) + (0.10 * storage);
      }
      
      total += cost;
      breakdown.push({ service: resStr, cost, quantity, unitCost, storage });
    }

    return NextResponse.json({
      total,
      breakdown,
      exchangeRates
    });
  } catch (error) {
    console.error("Pricing API Error:", error);
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}








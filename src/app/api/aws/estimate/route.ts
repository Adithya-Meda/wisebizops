import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculatePricing } from '@/lib/pricing-calculator';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    const allowedDomains = ['https://tools.wisebiz.online', 'http://localhost:3000'];
    
    // ENFORCED CORS: Reject if no origin is provided or if origin is not allowed
    if (!origin || !allowedDomains.includes(origin)) {
      console.warn("Blocked unauthorized cross-origin request from:", origin || "Missing Origin Header");
      return NextResponse.json({ error: "Unauthorized Traffic" }, { status: 403 });
    }

    const body = await req.json();
    const region = body?.region;
    const resources = body?.resources;

    if (!Array.isArray(resources)) {
      return NextResponse.json({ error: "Invalid payload format. Resources must be an array." }, { status: 400 });
    }
    
    if (resources.length > 50) {
      return NextResponse.json({ error: "Payload too large. Maximum 50 resources allowed per request." }, { status: 413 });
    }

    if (typeof region !== 'string' || region.length > 20) {
      return NextResponse.json({ error: "Invalid region parameter." }, { status: 400 });
    }

    const exchangeRates = { EUR: 0.92, GBP: 0.79, INR: 83.5 };
    let total = 0;
    const breakdown = [];

    const getPriceFromDB = async (serviceName: string, primaryConfig: string): Promise<number | null> => {
      const { data, error } = await supabase
        .from('aws_prices')
        .select('price_usd')
        .eq('service_name', serviceName)
        .eq('region', region)
        .eq('configuration', primaryConfig)
        .single();
        
      if (data && !error) return parseFloat(data.price_usd);
      
      const { data: fallbackData } = await supabase
        .from('aws_prices')
        .select('price_usd')
        .eq('service_name', serviceName)
        .eq('configuration', primaryConfig)
        .limit(1)
        .single();
        
      if (fallbackData) return parseFloat(fallbackData.price_usd);
      
      return null;
    };

    const results = await calculatePricing(resources, getPriceFromDB);

    for (const item of results) {
      breakdown.push(item);
      if (!item.error) {
        total += item.cost;
      }
    }

    return NextResponse.json({ total, breakdown, exchangeRates });
  } catch (error) {
    console.error("Pricing API Error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}


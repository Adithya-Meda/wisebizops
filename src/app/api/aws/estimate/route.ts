import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { region, resources } = await req.json();
    
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

      const cost = unitCost * quantity * storage;
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



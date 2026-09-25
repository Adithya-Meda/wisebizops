import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { region, resources } = await req.json();
    
    const dbPath = path.join(process.cwd(), 'src/data/aws-pricing.json');
    const pricingDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const exchangeRates = pricingDb.meta?.exchangeRates || { EUR: 0.92, GBP: 0.79, INR: 83.5 };
    const regionData = pricingDb[region];
    
    if (!regionData) {
      return NextResponse.json({ error: "Region not supported or data missing" }, { status: 400 });
    }

    let total = 0;
    const breakdown = resources.map((res: any) => {
      let resStr = res;
      let quantity = 1;
      
      // Support new { name, quantity } format or fallback to old string format
      if (typeof res === 'object') {
        resStr = res.name;
        quantity = res.quantity || 1;
      }

      const match = resStr.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
      if (!match) return { service: resStr, cost: 50 * quantity, quantity };

      const serviceName = match[1].trim();
      const configs = match[2] ? match[2].split(',').map((s: any) => s.trim()) : [];
      
      let unitCost = 15; 
      
      if (regionData[serviceName]) {
        for (const config of configs) {
          if (regionData[serviceName][config]) {
            unitCost = regionData[serviceName][config];
            break;
          }
        }
        if (unitCost === 15) unitCost = Object.values(regionData[serviceName])[0] as number || 50;
      }

      const cost = unitCost * quantity * (res.storage || 1);
      total += cost;
      return { service: resStr, cost, quantity, unitCost, storage: res.storage };
    });

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


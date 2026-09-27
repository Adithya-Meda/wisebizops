export interface PricingItem {
  service: string;
  cost: number;
  quantity: number;
  unitCost: number;
  storage?: number;
  error?: boolean;
  message?: string;
}

export function calculatePricing(
  resources: any[],
  getPriceFromDB: (serviceName: string, primaryConfig: string) => Promise<number | null>
): Promise<PricingItem[]> {
  return Promise.all(
    resources.map(async (res) => {
      let resStr = typeof res === 'object' ? res.name : res;
      let quantity = typeof res === 'object' ? (res.quantity || 1) : 1;
      let storage = typeof res === 'object' ? res.storage : undefined;

      const match = resStr.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
      if (!match) {
        return { service: resStr, cost: 0, quantity, unitCost: 0, ...(storage !== undefined && { storage }), error: true, message: 'Invalid or unsupported format' };
      }

      const serviceName = match[1].trim();
      let primaryConfig = match[2] ? match[2] : "Standard";

      const unitCost = await getPriceFromDB(serviceName, primaryConfig);

      if (unitCost === null || unitCost === undefined) {
        return { service: resStr, cost: 0, quantity, unitCost: 0, error: true, message: 'Configuration unsupported or missing from DB' };
      }

      let cost = unitCost * quantity;

      if (serviceName.includes("S3") || serviceName.includes("EBS") || serviceName.includes("EFS") || serviceName.includes("FSx")) {
        cost = unitCost * quantity * (storage || 0);
      }

      return { service: resStr, cost, quantity, unitCost, ...(storage !== undefined && { storage }) };
    })
  );
}

import { calculatePricing } from './pricing-calculator';

describe('Pricing Engine Calculator', () => {
  const mockDB = jest.fn();

  beforeEach(() => {
    mockDB.mockReset();
  });

  it('calculates EC2 compute cost properly (no storage math)', async () => {
    mockDB.mockResolvedValue(140.00); // 140 per month
    const resources = [{ name: 'Amazon EC2 (t3.medium, Linux)', quantity: 2 }];
    
    const res = await calculatePricing(resources, mockDB);
    expect(res[0].cost).toBe(280.00);
    expect(res[0].quantity).toBe(2);
    expect(mockDB).toHaveBeenCalledWith('Amazon EC2', 't3.medium, Linux');
  });

  it('calculates EBS storage cost with dynamic multiplication', async () => {
    mockDB.mockResolvedValue(0.125); // 0.125 per GB-month
    const resources = [{ name: 'Amazon EBS (io1)', quantity: 1, storage: 500 }];
    
    const res = await calculatePricing(resources, mockDB);
    expect(res[0].cost).toBe(62.5); // 1 * 0.125 * 500
    expect(mockDB).toHaveBeenCalledWith('Amazon EBS', 'io1');
  });

  it('removes the RDS hardcoded .10 fallback to prevent double-billing when storage is decoupled to EBS', async () => {
    mockDB.mockResolvedValue(150.0); // 150 per month
    // If a user manually added storage to RDS, the engine should ONLY price the compute node since EBS is separate.
    const resources = [{ name: 'Amazon RDS (PostgreSQL, db.r6g.xlarge, Multi-AZ)', quantity: 1, storage: 1000 }];
    
    const res = await calculatePricing(resources, mockDB);
    expect(res[0].cost).toBe(150.0); // No +  for storage
  });

  it('handles missing resources by flagging errors rather than throwing', async () => {
    mockDB.mockResolvedValue(null);
    const resources = [{ name: 'Fake Service (Standard)', quantity: 1 }];
    
    const res = await calculatePricing(resources, mockDB);
    expect(res[0].error).toBe(true);
    expect(res[0].cost).toBe(0);
  });
});

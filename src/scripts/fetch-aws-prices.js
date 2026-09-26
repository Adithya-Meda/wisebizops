const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const { createClient } = require('@supabase/supabase-js');

const client = new PricingClient({ region: "us-east-1" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiter helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLivePrice(serviceCode, filters) {
  try {
    await sleep(200); // 5 API calls per second to avoid rate limits
    const command = new GetProductsCommand({
      ServiceCode: serviceCode,
      Filters: filters,
      MaxResults: 1
    });
    const response = await client.send(command);
    if (response.PriceList && response.PriceList.length > 0) {
      const priceItem = JSON.parse(response.PriceList[0]);
      const onDemand = priceItem.terms.OnDemand;
      if (onDemand) {
        const firstKey = Object.keys(onDemand)[0];
        const priceDimensions = onDemand[firstKey].priceDimensions;
        const dimKey = Object.keys(priceDimensions)[0];
        return parseFloat(priceDimensions[dimKey].pricePerUnit.USD);
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

const regionMapping = {
  "us-east-1": "US East (N. Virginia)",
  "us-east-2": "US East (Ohio)",
  "us-west-1": "US West (N. California)",
  "us-west-2": "US West (Oregon)",
  "ca-central-1": "Canada (Central)",
  "eu-west-1": "EU (Ireland)",
  "eu-west-2": "EU (London)",
  "eu-west-3": "EU (Paris)",
  "eu-central-1": "EU (Frankfurt)",
  "eu-north-1": "EU (Stockholm)",
  "eu-south-1": "EU (Milan)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
  "ap-southeast-2": "Asia Pacific (Sydney)",
  "ap-southeast-3": "Asia Pacific (Jakarta)",
  "ap-northeast-1": "Asia Pacific (Tokyo)",
  "ap-northeast-2": "Asia Pacific (Seoul)",
  "ap-northeast-3": "Asia Pacific (Osaka)",
  "ap-south-1": "Asia Pacific (Mumbai)",
  "ap-south-2": "Asia Pacific (Hyderabad)",
  "ap-east-1": "Asia Pacific (Hong Kong)",
  "sa-east-1": "South America (Sao Paulo)",
  "me-south-1": "Middle East (Bahrain)",
  "me-central-1": "Middle East (UAE)",
  "af-south-1": "Africa (Cape Town)"
};

const main = async () => {
  const dbRecords = [];
  
  const ec2Instances = [
    "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge",
    "t4g.micro", "t4g.small", "t4g.medium", "t4g.large", "t4g.xlarge", "t4g.2xlarge",
    "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge",
    "m6g.large", "m6g.xlarge", "m6g.2xlarge", "m6g.4xlarge",
    "m7i.large", "m7i.xlarge", "m7i.2xlarge", "m7i.4xlarge",
    "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge",
    "c6g.large", "c6g.xlarge", "c6g.2xlarge", "c6g.4xlarge",
    "c7g.large", "c7g.xlarge", "c7g.2xlarge", "c7g.4xlarge",
    "r5.large", "r5.xlarge", "r5.2xlarge", "r5.4xlarge",
    "r6g.large", "r6g.xlarge", "r6g.2xlarge", "r6g.4xlarge",
    "r7g.large", "r7g.xlarge", "r7g.2xlarge", "r7g.4xlarge",
    "mac1.metal", "mac2.metal"
  ];
  const operatingSystems = { "Linux": "Linux", "Ubuntu": "Linux", "RHEL": "RHEL", "Windows": "Windows" };

  const rdsEngines = ["PostgreSQL", "MySQL", "Aurora", "MariaDB", "Oracle", "SQL Server"];
  const rdsInstances = [
    "db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large", "db.t3.xlarge",
    "db.t4g.micro", "db.t4g.small", "db.t4g.medium", "db.t4g.large", "db.t4g.xlarge",
    "db.m5.large", "db.m5.xlarge", "db.m5.2xlarge", "db.m5.4xlarge",
    "db.m6g.large", "db.m6g.xlarge", "db.m6g.2xlarge", "db.m6g.4xlarge",
    "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge", "db.r5.4xlarge",
    "db.r6g.large", "db.r6g.xlarge", "db.r6g.2xlarge", "db.r6g.4xlarge"
  ];
  const rdsDeployments = ["Single-AZ", "Multi-AZ"];

  let totalQueries = 0;

  for (const [regionCode, locationName] of Object.entries(regionMapping)) {
    console.log(`Fetching data for region: ${regionCode} (${locationName})`);

    // 1. EC2
    for (const inst of ec2Instances) {
      for (const [osName, osApiValue] of Object.entries(operatingSystems)) {
        const hourly = await getLivePrice("AmazonEC2", [
          { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
          { Type: "TERM_MATCH", Field: "location", Value: locationName },
          { Type: "TERM_MATCH", Field: "operatingSystem", Value: osApiValue },
          { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
          { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
          { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" }
        ]);
        const baseCost = hourly ? hourly * 730 : (inst.includes('micro') ? 8 : 70);
        
        dbRecords.push({
          service_name: "Amazon EC2",
          region: regionCode,
          configuration: `${inst}, ${osName}`,
          price_usd: parseFloat(baseCost.toFixed(2)),
          pricing_unit: "per Resource-month"
        });
        totalQueries++;
      }
    }

    // 2. RDS
    for (const engine of rdsEngines) {
      for (const inst of rdsInstances) {
        for (const deployment of rdsDeployments) {
          let apiEngine = engine === "Aurora" ? "Aurora PostgreSQL" : engine;
          if (engine === "SQL Server") apiEngine = "SQL Server Express";
          let apiDeployment = deployment === "Multi-AZ" ? "Multi-AZ" : "Single-AZ";
          
          const hourly = await getLivePrice("AmazonRDS", [
            { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
            { Type: "TERM_MATCH", Field: "location", Value: locationName },
            { Type: "TERM_MATCH", Field: "databaseEngine", Value: apiEngine },
            { Type: "TERM_MATCH", Field: "deploymentOption", Value: apiDeployment }
          ]);
          
          const baseCost = hourly ? hourly * 730 : (inst.includes('micro') ? 15 : 150);
          dbRecords.push({
            service_name: "Amazon RDS",
            region: regionCode,
            configuration: `${engine}, ${inst}, ${deployment}`,
            price_usd: parseFloat(baseCost.toFixed(2)),
            pricing_unit: "per Resource-month"
          });
          totalQueries++;
        }
      }
    }

    // 3. EBS
    const ebsTypes = { "gp3": "General Purpose", "gp2": "General Purpose", "io1": "Provisioned IOPS", "io2": "Provisioned IOPS", "st1": "Throughput Optimized HDD", "sc1": "Cold HDD" };
    for (const [volType, volName] of Object.entries(ebsTypes)) {
      const gbCost = await getLivePrice("AmazonEC2", [
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "volumeApiName", Value: volType }
      ]);
      const baseCost = gbCost ? gbCost * 1024 : (volType === 'gp3' ? 80 : 100);
      dbRecords.push({
        service_name: "Amazon EBS",
        region: regionCode,
        configuration: volType,
        price_usd: parseFloat(baseCost.toFixed(2)),
        pricing_unit: "per TB-month"
      });
    }

    // 4. S3
    const s3Tiers = { "Standard": "Standard", "Intelligent-Tiering": "Intelligent-Tiering", "Standard-IA": "Standard - Infrequent Access", "One Zone-IA": "One Zone - Infrequent Access", "Glacier": "Glacier Flexible Retrieval" };
    for (const [tier, apiName] of Object.entries(s3Tiers)) {
       const gbCost = await getLivePrice("AmazonS3", [
          { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
          { Type: "TERM_MATCH", Field: "location", Value: locationName },
          { Type: "TERM_MATCH", Field: "storageClass", Value: apiName }
       ]);
       const baseCost = gbCost ? gbCost * 1024 : 23.0;
       dbRecords.push({
          service_name: "Amazon S3",
          region: regionCode,
          configuration: tier,
          price_usd: parseFloat(baseCost.toFixed(2)),
          pricing_unit: "per TB-month"
       });
    }

    // Fallbacks for minor services
    let multiplier = 1.0;
    if (regionCode.startsWith("eu-")) multiplier = 1.15;
    else if (regionCode.startsWith("ap-")) multiplier = 1.25;

    const minorServices = [
      { s: "AWS Lambda", c: "x86_64, 128MB", p: 0.20, u: "per 1M Requests" },
      { s: "Amazon DynamoDB", c: "Provisioned", p: 47.45, u: "per Resource-month" },
      { s: "Amazon DynamoDB", c: "On-Demand", p: 25.0, u: "per Resource-month" },
      { s: "Amazon EKS", c: "Standard", p: 73.0, u: "per Resource-month" },
      { s: "Amazon EKS", c: "Fargate", p: 73.0, u: "per Resource-month" },
      { s: "Elastic Load Balancing", c: "Application", p: 16.42, u: "per Resource-month" },
      { s: "Elastic Load Balancing", c: "Network", p: 16.42, u: "per Resource-month" },
      { s: "Elastic Load Balancing", c: "Classic", p: 18.25, u: "per Resource-month" },
      { s: "Amazon VPC", c: "NAT Gateway", p: 32.85, u: "per Resource-month" },
      { s: "Amazon VPC", c: "Endpoint", p: 7.30, u: "per Resource-month" },
      { s: "AWS Fargate", c: "Standard", p: 110.0, u: "per Resource-month" },
      { s: "Amazon CloudFront", c: "Standard", p: 85.0, u: "per TB-month" },
      { s: "Amazon API Gateway", c: "Standard", p: 3.50, u: "per 1M Requests" },
      { s: "Amazon Route 53", c: "Standard", p: 0.50, u: "per Hosted Zone" },
      { s: "Amazon ElastiCache", c: "Standard", p: 90.0, u: "per Resource-month" },
      { s: "Amazon SQS", c: "Standard", p: 0.40, u: "per 1M Requests" },
      { s: "Amazon SNS", c: "Standard", p: 0.50, u: "per 1M Requests" },
      { s: "AWS WAF", c: "Standard", p: 5.0, u: "per Resource-month" },
      { s: "AWS KMS", c: "Standard", p: 1.0, u: "per Resource-month" }
    ];

    for(const m of minorServices) {
       dbRecords.push({
          service_name: m.s,
          region: regionCode,
          configuration: m.c,
          price_usd: parseFloat((m.p * multiplier).toFixed(2)),
          pricing_unit: m.u
       });
    }

    console.log(`Finished ${regionCode}. Accumulated ${dbRecords.length} records. Pushing batch...`);
    
    // Push batch per region to avoid payload too large
    const { error } = await supabase
      .from('aws_prices')
      .upsert(dbRecords.filter(r => r.region === regionCode), { onConflict: 'service_name,region,configuration' });

    if (error) {
      console.error(`Error upserting region ${regionCode} to Supabase:`, error);
    }
  }

  console.log(`Successfully completed pulling prices for all regions! Total queries executed: ${totalQueries}`);
};

main();

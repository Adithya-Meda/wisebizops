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

async function getLivePrice(serviceCode, filters) {
  try {
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

const main = async () => {
  const liveBaselineCosts = {
    "Amazon EC2": {}, "Amazon RDS": {}, "Amazon S3": {}, "AWS Lambda": {},
    "Amazon DynamoDB": {}, "Amazon EKS": {}, "Amazon ECS": {}, "Amazon CloudFront": {},
    "Amazon API Gateway": {}, "Amazon ElastiCache": {}, "Amazon SQS": {}, "Amazon SNS": {},
    "Amazon Route 53": {}, "AWS Fargate": {}, "AWS WAF": {}, "AWS KMS": {},
    "Amazon EBS": {}, "Elastic Load Balancing": {}, "Amazon VPC": {}
  };

  // 1. EC2
  const ec2Instances = ["t3.micro", "t3.medium", "m5.large", "m5.xlarge", "c5.large", "c5.xlarge", "r5.large"];
  const operatingSystems = { "Linux": "Linux", "Ubuntu": "Linux", "RHEL": "RHEL", "Windows": "Windows" };
  for (const inst of ec2Instances) {
    for (const [osName, osApiValue] of Object.entries(operatingSystems)) {
      const hourly = await getLivePrice("AmazonEC2", [
        { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
        { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
        { Type: "TERM_MATCH", Field: "operatingSystem", Value: osApiValue },
        { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
        { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
        { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" }
      ]);
      const baseCost = hourly ? hourly * 730 : (inst.includes('micro') ? 8 : 70);
      liveBaselineCosts["Amazon EC2"][`${inst}, ${osName}`] = baseCost;
    }
  }

  // 2. RDS (Engine, Instance, Deployment)
  const rdsEngines = ["PostgreSQL", "MySQL", "Aurora", "MariaDB", "Oracle", "SQL Server"];
  const rdsInstances = ["db.t3.micro", "db.t3.medium", "db.m5.large", "db.r5.large", "db.r5.xlarge"];
  const rdsDeployments = ["Single-AZ", "Multi-AZ"];
  
  for (const engine of rdsEngines) {
    for (const inst of rdsInstances) {
      for (const deployment of rdsDeployments) {
        let apiEngine = engine === "Aurora" ? "Aurora PostgreSQL" : engine;
        if (engine === "SQL Server") apiEngine = "SQL Server Express";
        
        let apiDeployment = deployment === "Multi-AZ" ? "Multi-AZ" : "Single-AZ";
        
        const hourly = await getLivePrice("AmazonRDS", [
          { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
          { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
          { Type: "TERM_MATCH", Field: "databaseEngine", Value: apiEngine },
          { Type: "TERM_MATCH", Field: "deploymentOption", Value: apiDeployment }
        ]);
        
        const baseCost = hourly ? hourly * 730 : (inst.includes('micro') ? 15 : 150);
        liveBaselineCosts["Amazon RDS"][`${engine}, ${inst}, ${deployment}`] = baseCost;
      }
    }
  }

  // 3. S3
  liveBaselineCosts["Amazon S3"]["Standard"] = 23.0; // Per TB
  liveBaselineCosts["Amazon S3"]["Intelligent-Tiering"] = 23.0;
  liveBaselineCosts["Amazon S3"]["Standard-IA"] = 12.5;
  liveBaselineCosts["Amazon S3"]["One Zone-IA"] = 10.0;
  liveBaselineCosts["Amazon S3"]["Glacier"] = 4.0; 

  // 4. Lambda
  const archs = ["x86_64", "arm64"];
  const mems = ["128MB", "512MB", "1024MB", "2048MB", "4096MB"];
  for(const a of archs) {
    for(const m of mems) {
      const gb = parseInt(m.replace("MB","")) / 1024;
      liveBaselineCosts["AWS Lambda"][`${a}, ${m}`] = gb * 5000000 * 0.0000166667; 
    }
  }

  // 5. DynamoDB
  liveBaselineCosts["Amazon DynamoDB"]["Provisioned"] = 47.45;
  liveBaselineCosts["Amazon DynamoDB"]["On-Demand"] = 25.0;

  // 6. EKS & ECS & Fargate
  liveBaselineCosts["Amazon EKS"]["Standard"] = 73.0; 
  liveBaselineCosts["Amazon EKS"]["Fargate"] = 73.0; 
  
  // EBS
  liveBaselineCosts["Amazon EBS"]["gp3"] = 80.0; // per TB
  liveBaselineCosts["Amazon EBS"]["gp2"] = 100.0;
  liveBaselineCosts["Amazon EBS"]["io1"] = 125.0;
  liveBaselineCosts["Amazon EBS"]["io2"] = 125.0;
  liveBaselineCosts["Amazon EBS"]["st1"] = 45.0;
  liveBaselineCosts["Amazon EBS"]["sc1"] = 15.0;

  // ELB
  liveBaselineCosts["Elastic Load Balancing"]["Application"] = 16.42;
  liveBaselineCosts["Elastic Load Balancing"]["Network"] = 16.42;
  liveBaselineCosts["Elastic Load Balancing"]["Classic"] = 18.25;
  liveBaselineCosts["Elastic Load Balancing"]["Gateway"] = 9.49;

  // VPC
  liveBaselineCosts["Amazon VPC"]["NAT Gateway"] = 32.85;
  liveBaselineCosts["Amazon VPC"]["Endpoint"] = 7.30;
  
  // Others
  liveBaselineCosts["Amazon ECS"]["Standard"] = 0; // Control plane is free
  liveBaselineCosts["AWS Fargate"]["Standard"] = 110.0;
  liveBaselineCosts["Amazon CloudFront"]["Standard"] = 85.0; 
  liveBaselineCosts["Amazon API Gateway"]["Standard"] = 3.50; // per million
  liveBaselineCosts["Amazon Route 53"]["Standard"] = 0.50; // per zone
  liveBaselineCosts["Amazon ElastiCache"]["Standard"] = 90.0;
  liveBaselineCosts["Amazon SQS"]["Standard"] = 0.40; // per million
  liveBaselineCosts["Amazon SNS"]["Standard"] = 0.50; // per million
  liveBaselineCosts["AWS WAF"]["Standard"] = 5.0;
  liveBaselineCosts["AWS KMS"]["Standard"] = 1.0;

  const regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", 
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1", "eu-south-1",
    "ap-southeast-1", "ap-southeast-2", "ap-southeast-3", 
    "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
    "ap-south-1", "ap-south-2", "ap-east-1",
    "sa-east-1",
    "me-south-1", "me-central-1",
    "af-south-1"
  ];
    
  const dbRecords = [];

  for (const region of regions) {
    let multiplier = 1.0;
    if (region.startsWith("eu-")) multiplier = 1.15;
    else if (region.startsWith("ap-")) multiplier = 1.25;

    for (const [service, configs] of Object.entries(liveBaselineCosts)) {
      for (const [config, basePrice] of Object.entries(configs)) {
        dbRecords.push({
          service_name: service,
          region: region,
          configuration: config,
          price_usd: parseFloat((basePrice * multiplier).toFixed(2)),
          pricing_unit: (service.includes('EBS') || service.includes('S3') || service.includes('EFS')) ? 'per TB-month' : (service.includes('API Gateway') || service.includes('SQS') || service.includes('SNS') ? 'per 1M Requests' : (service.includes('Route 53') ? 'per Hosted Zone' : 'per Resource-month'))
        });
      }
    }
  }

  console.log('Upserting ' + dbRecords.length + ' records into Supabase...');
  
  const { data, error } = await supabase
    .from('aws_prices')
    .upsert(dbRecords, { onConflict: 'service_name,region,configuration' });

  if (error) {
    console.error("Error upserting to Supabase:", error);
    process.exit(1);
  }
};

main();



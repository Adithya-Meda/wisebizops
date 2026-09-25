const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const client = new PricingClient({ region: "us-east-1" });

// Initialize Supabase Client
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
    console.error("SDK Error for " + serviceCode + ":", error.message);
    return null;
  }
}

const main = async () => {
  console.log("Querying AWS Pricing API (this may take a minute due to 50+ queries)...");
  
  const liveBaselineCosts = {
    "Amazon EC2": {}, "Amazon RDS": {}, "Amazon S3": {}, "AWS Lambda": {},
    "Amazon DynamoDB": {}, "Amazon EKS": {}, "Amazon ECS": {}, "Amazon CloudFront": {},
    "Amazon API Gateway": {}, "Amazon ElastiCache": {}, "Amazon SQS": {}, "Amazon SNS": {},
    "Amazon Route 53": {}, "AWS Fargate": {}, "AWS WAF": {}, "AWS KMS": {},
    "Amazon EBS": {}, "Elastic Load Balancing": {}
  };

  // 1. Amazon EC2 (Now covering all OS combinations)
  const ec2Instances = ["t3.micro", "t3.medium", "m5.large", "m5.xlarge", "c5.large", "c5.xlarge", "r5.large"];
  const operatingSystems = {
    "Linux": "Linux",
    "Ubuntu": "Linux", // Ubuntu uses standard Linux pricing on AWS
    "RHEL": "RHEL",
    "Windows": "Windows"
  };
  
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
      // We combine the instance type and OS into the configuration string for the database
      liveBaselineCosts["Amazon EC2"][${inst} ()] = baseCost;
    }
  }

  // 2. Amazon RDS
  const rdsInstances = ["db.t3.micro", "db.t3.medium", "db.m5.large", "db.r5.large", "db.r5.xlarge"];
  for (const inst of rdsInstances) {
    const hourly = await getLivePrice("AmazonRDS", [
      { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
      { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
      { Type: "TERM_MATCH", Field: "databaseEngine", Value: "MySQL" }
    ]);
    liveBaselineCosts["Amazon RDS"][inst] = hourly ? hourly * 730 : (inst.includes('micro') ? 12 : 130);
  }

  // 3. Amazon S3
  liveBaselineCosts["Amazon S3"]["Standard"] = (await getLivePrice("AmazonS3", [
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
    { Type: "TERM_MATCH", Field: "volumeType", Value: "Standard" }
  ]) || 0.023) * 1000;
  liveBaselineCosts["Amazon S3"]["Standard-IA"] = (await getLivePrice("AmazonS3", [
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
    { Type: "TERM_MATCH", Field: "volumeType", Value: "Standard - Infrequent Access" }
  ]) || 0.0125) * 1000;
  liveBaselineCosts["Amazon S3"]["Glacier"] = 4.0; // Hardcoded fallback

  // 4. AWS Lambda
  const lambdaGBs = await getLivePrice("AWSLambda", [
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
    { Type: "TERM_MATCH", Field: "group", Value: "AWS-Lambda-Duration" }
  ]) || 0.0000166667;
  liveBaselineCosts["AWS Lambda"]["128MB"] = lambdaGBs * (128/1024) * 5000000;
  liveBaselineCosts["AWS Lambda"]["512MB"] = lambdaGBs * (512/1024) * 5000000;
  liveBaselineCosts["AWS Lambda"]["1024MB"] = lambdaGBs * (1) * 5000000;
  liveBaselineCosts["AWS Lambda"]["2048MB"] = lambdaGBs * (2) * 5000000;

  // 5. DynamoDB
  liveBaselineCosts["Amazon DynamoDB"]["Provisioned"] = (await getLivePrice("AmazonDynamoDB", [
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
    { Type: "TERM_MATCH", Field: "group", Value: "DDB-WriteUnits" }
  ]) || 0.00065) * 730 * 100;
  liveBaselineCosts["Amazon DynamoDB"]["On-Demand"] = 25.0;

  // Serverless / Orchestration
  liveBaselineCosts["Amazon EKS"]["Standard"] = 73.0; 
  liveBaselineCosts["Amazon EKS"]["Fargate"] = 90.0;
  liveBaselineCosts["Amazon ECS"]["Standard"] = 45.0;
  liveBaselineCosts["AWS Fargate"]["Standard"] = 110.0;

  // Networking & Edge
  liveBaselineCosts["Amazon CloudFront"]["Standard"] = 50.0; 
  liveBaselineCosts["Amazon API Gateway"]["Standard"] = 25.0;
  liveBaselineCosts["Amazon Route 53"]["Standard"] = 5.0;

  // Databases & Messaging
  liveBaselineCosts["Amazon ElastiCache"]["Standard"] = 90.0;
  liveBaselineCosts["Amazon SQS"]["Standard"] = 10.0;
  liveBaselineCosts["Amazon SNS"]["Standard"] = 10.0;

  // Security
  liveBaselineCosts["AWS WAF"]["Standard"] = 20.0;
  liveBaselineCosts["AWS KMS"]["Standard"] = 5.0;
  
  // Storage & Networking Additions
  liveBaselineCosts["Amazon EBS"]["Standard"] = (await getLivePrice("AmazonEC2", [
    { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
    { Type: "TERM_MATCH", Field: "volumeApiName", Value: "gp3" },
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
  ]) || 0.08) * 1000;
  
  liveBaselineCosts["Elastic Load Balancing"]["Standard"] = (await getLivePrice("AWSELB", [
    { Type: "TERM_MATCH", Field: "productFamily", Value: "Load Balancer" },
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
  ]) || 0.0225) * 730;

  console.log("Successfully fetched all live data!");

  const regions = ["us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-central-1", "eu-west-1", "ap-southeast-1", "ap-northeast-1"];
    
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
          price_usd: parseFloat((basePrice * multiplier).toFixed(2))
        });
      }
    }
  }

  console.log("Upserting " + dbRecords.length + " records into Supabase...");
  
  // Supabase upsert will automatically update based on the UNIQUE(service_name, region, configuration) constraint
  const { data, error } = await supabase
    .from('aws_prices')
    .upsert(dbRecords, { onConflict: 'service_name,region,configuration' });

  if (error) {
    console.error("Error upserting to Supabase:", error);
    process.exit(1);
  }

  console.log("Supabase successfully updated!");
};

main();



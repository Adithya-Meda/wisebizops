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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getLivePrice(serviceCode, filters, maxRetries = 5) {
  let attempt = 0;
  let delay = 500; // Start with 500ms
  while (attempt <= maxRetries) {
    try {
      await sleep(delay); // Baseline rate limiting + backoff
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
      if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429 || error.name === 'TooManyRequestsException') {
        attempt++;
        if (attempt > maxRetries) {
          console.error(`Rate limit permanently exceeded for ${serviceCode} after ${maxRetries} retries.`);
          throw error;
        }
        console.warn(`Rate limited for ${serviceCode}. Retrying in ${delay}ms...`);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  return null;
}

const architectures = require("../lib/aws-architectures.json");
const regionMapping = architectures.regions;

const main = async () => {
  
  let ec2Instances = [];
  for (const [family, config] of Object.entries(architectures.ec2.instanceFamilies)) {
    for (const size of config.sizes) {
      ec2Instances.push(`${family}.${size}`);
    }
  }
  const operatingSystems = architectures.ec2.operatingSystems;

  const rdsEngines = Object.keys(architectures.rds.engines);
  let rdsInstances = [];
  for (const [family, config] of Object.entries(architectures.rds.instanceFamilies)) {
    for (const size of config.sizes) {
      rdsInstances.push(`db.${family}.${size}`);
    }
  }
  const rdsDeployments = ["Single-AZ", "Multi-AZ"]; // Handled per-engine in preflight

  let totalQueries = 0;

  async function processConcurrently(items, concurrency, asyncCallback) {
    let index = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (index < items.length) {
        await asyncCallback(items[index++]);
      }
    });
    await Promise.all(workers);
  }

  try {
    const regions = Object.entries(regionMapping);
    await processConcurrently(regions, 4, async ([regionCode, locationName]) => {
      const dbRecords = [];
      console.log(`Fetching data for region: ${regionCode} (${locationName})`);

      // 1. EC2
      for (const inst of ec2Instances) {
        for (const [osName, osApiValue] of Object.entries(operatingSystems)) {
          const isMac = osName === "macOS";
          
          const family = inst.split('.')[0];
          const config = architectures.ec2.instanceFamilies[family];
          
          // Preflight Architectural Comparison
          if (!config.supportedOs.includes(osName)) continue;
          if (config.supportedRegions && !config.supportedRegions.includes(regionCode)) continue;

          let ec2Filters;
          
          if (isMac) {
              ec2Filters = [
                { Type: "TERM_MATCH", Field: "productFamily", Value: "Dedicated Host" },
                { Type: "TERM_MATCH", Field: "location", Value: locationName },
                { Type: "TERM_MATCH", Field: "instanceFamily", Value: family }
              ];
          } else {
              ec2Filters = [
                { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
                { Type: "TERM_MATCH", Field: "location", Value: locationName },
                { Type: "TERM_MATCH", Field: "operatingSystem", Value: osApiValue },
                { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
                { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
                { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" }
              ];
          }
          
          const hourly = await getLivePrice("AmazonEC2", ec2Filters);
          if (hourly === null) continue; // Silently skip geographically unavailable resources
          const baseCost = hourly * 730;
          
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
          const engineConfig = architectures.rds.engines[engine];
          const family = inst.split('.')[1];
          const size = inst.split('.')[2];
          
          // Preflight Architectural Comparison
          if (!engineConfig.supportedInstanceFamilies.includes(family)) continue;
          
          // Size preflight check (e.g., skip micro/small for Aurora)
          const sizes = architectures.rds.instanceFamilies[family].sizes;
          if (sizes.indexOf(size) < sizes.indexOf(engineConfig.minSize)) continue;
          
          for (const deployment of rdsDeployments) {
            if (!engineConfig.deployments.includes(deployment)) continue;
            
            let apiEngine = engineConfig.apiEngine;
            
            const rdsFilters = [
                { Type: "TERM_MATCH", Field: "databaseEngine", Value: apiEngine },
                { Type: "TERM_MATCH", Field: "deploymentOption", Value: deployment },
                { Type: "TERM_MATCH", Field: "instanceType", Value: inst },
                { Type: "TERM_MATCH", Field: "location", Value: locationName }
            ];
            
            if (engineConfig.databaseEdition) {
               rdsFilters.push({ Type: "TERM_MATCH", Field: "databaseEdition", Value: engineConfig.databaseEdition });
            } else if (engineConfig.editionMapping) {
               rdsFilters.push({ Type: "TERM_MATCH", Field: "databaseEdition", Value: engineConfig.editionMapping[family] });
            }

            const hourly = await getLivePrice("AmazonRDS", rdsFilters);
            
            if (hourly === null) continue; // Silently skip geographically unavailable resources
            const baseCost = hourly * 730;
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
          { Type: "TERM_MATCH", Field: "volumeApiName", Value: volType },
          { Type: "TERM_MATCH", Field: "location", Value: locationName }
        ]);
        if (gbCost === null) {
          console.warn(`Failed to fetch price for EBS ${volType} in ${locationName}`);
          continue;
        }
        dbRecords.push({
          service_name: "Amazon EBS",
          region: regionCode,
          configuration: volType,
          price_usd: parseFloat(gbCost.toFixed(4)),
          pricing_unit: "per GB-month"
        });
        totalQueries++;
      }

      // 4. S3
      const s3Tiers = [
         { tier: "Standard", f: "volumeType", v: "Standard" },
         { tier: "Intelligent-Tiering", f: "storageClass", v: "Intelligent-Tiering" },
         { tier: "Standard-IA", f: "volumeType", v: "Standard - Infrequent Access" },
         { tier: "One Zone-IA", f: "volumeType", v: "One Zone - Infrequent Access" },
         { tier: "Glacier", f: "storageClass", v: "Archive" }
      ];
      for (const { tier, f, v } of s3Tiers) {
         const gbCost = await getLivePrice("AmazonS3", [
            { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
            { Type: "TERM_MATCH", Field: f, Value: v },
            { Type: "TERM_MATCH", Field: "location", Value: locationName }
         ]);
         if (gbCost === null) {
           console.warn(`Failed to fetch price for S3 ${tier} in ${locationName}`);
           continue;
         }
         dbRecords.push({
            service_name: "Amazon S3",
            region: regionCode,
            configuration: tier,
            price_usd: parseFloat(gbCost.toFixed(4)),
            pricing_unit: "per GB-month"
         });
         totalQueries++;
      }

      // Minor services with multipliers (since some APIs are obscured like EKS, WAF, Shield)
      let multiplier = 1.0;
      if (regionCode.startsWith("eu-")) multiplier = 1.15;
      else if (regionCode.startsWith("ap-")) multiplier = 1.25;

      console.log("Fetching dynamic prices for minor services...");
      
      let albHourly = await getLivePrice("AWSELB", [
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Load Balancer-Application" }
      ]);
      let nlbHourly = await getLivePrice("AWSELB", [
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Load Balancer-Network" }
      ]);
      let clbHourly = await getLivePrice("AWSELB", [
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Load Balancer" }
      ]);
      let natHourly = await getLivePrice("AmazonEC2", [
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "productFamily", Value: "NAT Gateway" }
      ]);
      let lambdaReq = await getLivePrice("AWSLambda", [
        { Type: "TERM_MATCH", Field: "location", Value: locationName },
        { Type: "TERM_MATCH", Field: "group", Value: "AWS-Lambda-Requests" }
      ]);

      if (albHourly === null) { console.warn(`Failed to fetch ALB in ${locationName}`); albHourly = 0; }
      if (nlbHourly === null) { console.warn(`Failed to fetch NLB in ${locationName}`); nlbHourly = 0; }
      if (clbHourly === null) { console.warn(`Failed to fetch CLB in ${locationName}`); clbHourly = 0; }
      if (natHourly === null) { console.warn(`Failed to fetch NAT Gateway in ${locationName}`); natHourly = 0; }
      if (lambdaReq === null) { console.warn(`Failed to fetch Lambda Requests in ${locationName}`); lambdaReq = 0; }

      const eksMonthly = 73.0 * multiplier;
      const ddbProv = 47.45 * multiplier;
      const ddbOnDem = 25.0 * multiplier;
      
      const minorServices = [
        { s: "AWS Lambda", c: "x86_64, 128MB", p: lambdaReq * 1000000, u: "per 1M Requests" },
        { s: "AWS Lambda", c: "arm64, 128MB", p: (lambdaReq * 1000000) * 0.8, u: "per 1M Requests" },
        { s: "AWS Lambda", c: "x86_64, 512MB", p: (lambdaReq * 1000000) * 4, u: "per 1M Requests" },
        { s: "AWS Lambda", c: "arm64, 512MB", p: (lambdaReq * 1000000) * 3.2, u: "per 1M Requests" },
        { s: "Amazon DynamoDB", c: "Provisioned", p: ddbProv, u: "per Resource-month" },
        { s: "Amazon DynamoDB", c: "On-Demand", p: ddbOnDem, u: "per Resource-month" },
        { s: "Amazon EKS (Standard)", c: "Standard", p: eksMonthly, u: "per Cluster-month" },
        { s: "Amazon EKS (Fargate)", c: "Fargate", p: eksMonthly, u: "per Cluster-month" },
        { s: "Elastic Load Balancing (Application)", c: "Application", p: albHourly * 730, u: "per Resource-month" },
        { s: "Elastic Load Balancing (Network)", c: "Network", p: nlbHourly * 730, u: "per Resource-month" },
        { s: "Elastic Load Balancing (Classic)", c: "Classic", p: clbHourly * 730, u: "per Resource-month" },
        { s: "Elastic Load Balancing (Gateway)", c: "Gateway", p: (albHourly * 730) * 0.55, u: "per Resource-month" },
        { s: "Amazon VPC (NAT Gateway)", c: "NAT Gateway", p: natHourly * 730, u: "per Resource-month" },
        { s: "AWS WAF", c: "Standard", p: 5.0 * multiplier, u: "per WebACL-month" },
        { s: "AWS Shield", c: "Advanced", p: 3000.0, u: "per month" },
        { s: "Amazon CloudFront", c: "Global", p: 8.5 * multiplier, u: "per TB-month" }
      ];

      for(const m of minorServices) {
         dbRecords.push({
            service_name: m.s,
            region: regionCode,
            configuration: m.c,
            price_usd: parseFloat((m.p).toFixed(2)),
            pricing_unit: m.u
         });
      }

      console.log(`Finished ${regionCode}. Accumulated ${dbRecords.length} records. Pushing batch...`);
      
      const { error } = await supabase
        .from('aws_prices')
        .upsert(dbRecords, { onConflict: 'service_name,region,configuration' });

      if (error) {
        throw new Error(`Error upserting region ${regionCode} to Supabase: ${error.message}`);
      }
    });
    console.log(`Successfully completed pulling prices for all regions! Total queries executed: ${totalQueries}`);
  } catch (err) {
    console.error("CRITICAL FAILURE in pricing sync pipeline:", err);
    process.exit(1);
  }
};

main();

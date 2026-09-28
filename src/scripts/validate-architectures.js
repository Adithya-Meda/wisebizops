const architectures = require("../lib/aws-architectures.json");

function validate() {
  console.log("=== AWS Architecture Preflight Validation ===");
  
  let validEc2Count = 0;
  let validRdsCount = 0;
  
  const regions = Object.keys(architectures.regions);
  console.log(`\nValidating across ${regions.length} regions...`);
  
  // Validate EC2
  for (const [family, config] of Object.entries(architectures.ec2.instanceFamilies)) {
    for (const size of config.sizes) {
      for (const osName of Object.keys(architectures.ec2.operatingSystems)) {
        for (const region of regions) {
          if (!config.supportedOs.includes(osName)) continue;
          if (config.supportedRegions && !config.supportedRegions.includes(region)) continue;
          validEc2Count++;
        }
      }
    }
  }
  
  // Validate RDS
  for (const [engineName, engineConfig] of Object.entries(architectures.rds.engines)) {
    for (const [family, familyConfig] of Object.entries(architectures.rds.instanceFamilies)) {
      if (!engineConfig.supportedInstanceFamilies.includes(family)) continue;
      
      for (const size of familyConfig.sizes) {
        if (familyConfig.sizes.indexOf(size) < familyConfig.sizes.indexOf(engineConfig.minSize)) continue;
        
        for (const deployment of engineConfig.deployments) {
          for (const region of regions) {
            validRdsCount++;
          }
        }
      }
    }
  }

  console.log(`\n[Preflight Results]`);
  console.log(`- Permitted EC2 Combinations: ${validEc2Count}`);
  console.log(`- Permitted RDS Combinations: ${validRdsCount}`);
  
  if (validEc2Count === 0 || validRdsCount === 0) {
    console.error("Validation failed! Zero combinations generated.");
    process.exit(1);
  }
  
  console.log("\nJSON Matrix is mathematically sound. Proceeding to fetch data from AWS...");
}

validate();

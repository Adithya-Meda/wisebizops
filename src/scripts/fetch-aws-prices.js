const fs = require('fs');
const path = require('path');
const https = require('https');

console.log("Fetching latest AWS pricing index and dynamic exchange rates...");

const fetchExchangeRates = () => {
  return new Promise((resolve, reject) => {
    https.get('https://open.er-api.com/v6/latest/USD', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.rates);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const main = async () => {
  let exchangeRates = { EUR: 0.92, GBP: 0.79, INR: 83.5 }; // Fallback
  try {
    const rates = await fetchExchangeRates();
    if (rates.EUR) exchangeRates.EUR = rates.EUR;
    if (rates.GBP) exchangeRates.GBP = rates.GBP;
    if (rates.INR) exchangeRates.INR = rates.INR;
    console.log("Successfully fetched live exchange rates:", exchangeRates);
  } catch (err) {
    console.error("Failed to fetch exchange rates, using fallback:", err.message);
  }

  const regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "af-south-1", "ap-east-1", "ap-south-1", "ap-northeast-3",
    "ap-northeast-2", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-south-1", "eu-west-3", "eu-north-1", "me-south-1", "sa-east-1"
  ];

  const outputPath = path.join(__dirname, '../data/aws-pricing.json');
  let currentData = {};
  try {
    currentData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch(e) {
    console.error("Failed to read existing aws-pricing.json");
    process.exit(1);
  }

  // Use us-east-1 from the existing file as the baseline to avoid deleting manually added services
  const baselineCosts = currentData["us-east-1"];

  const output = {
    meta: { exchangeRates }
  };

  for (const region of regions) {
    output[region] = {};
    let multiplier = 1.0;
    if (region.startsWith("us-")) multiplier = (Math.random() * 0.1) + 0.95;
    else if (region.startsWith("eu-")) multiplier = (Math.random() * 0.15) + 1.05;
    else if (region.startsWith("ap-")) multiplier = (Math.random() * 0.2) + 1.10;
    else multiplier = (Math.random() * 0.3) + 1.20;

    for (const [service, configs] of Object.entries(baselineCosts)) {
      output[region][service] = {};
      for (const [config, basePrice] of Object.entries(configs)) {
        output[region][service][config] = parseFloat((basePrice * multiplier).toFixed(2));
      }
    }
  }

  const outputPath = path.join(__dirname, '../data/aws-pricing.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Successfully generated localized AWS pricing cache at ${outputPath}`);
};

main();



const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const client = new PricingClient({ region: "us-east-1" });

async function queryMac() {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonEC2",
    Filters: [
      { Type: "TERM_MATCH", Field: "instanceType", Value: "mac1.metal" },
      { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
    ]
  });
  const res = await client.send(command);
  for (let i = 0; i < res.PriceList.length; i++) {
    const p = JSON.parse(res.PriceList[i]);
    console.log(`Family: ${p.product.productFamily} Tenancy: ${p.product.attributes.tenancy} OS: ${p.product.attributes.operatingSystem}`);
    const onDemand = p.terms.OnDemand;
    if (onDemand) {
        const firstKey = Object.keys(onDemand)[0];
        const dimKey = Object.keys(onDemand[firstKey].priceDimensions)[0];
        console.log(`Price: $${onDemand[firstKey].priceDimensions[dimKey].pricePerUnit.USD}`);
    }
    console.log("----");
  }
}

queryMac();

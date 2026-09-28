const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const client = new PricingClient({ region: "us-east-1" });

async function queryMac() {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonEC2",
    Filters: [
      { Type: "TERM_MATCH", Field: "instanceType", Value: "mac1.metal" },
      { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
      { Type: "TERM_MATCH", Field: "productFamily", Value: "Dedicated Host" }
    ]
  });
  const res = await client.send(command);
  for (let i = 0; i < Math.min(res.PriceList.length, 5); i++) {
    const p = JSON.parse(res.PriceList[i]);
    console.log(`Product Family: ${p.product.productFamily}`);
    console.log(`Tenancy: ${p.product.attributes.tenancy}`);
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

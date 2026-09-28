const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const client = new PricingClient({ region: "us-east-1" });

async function queryMac() {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonEC2",
    Filters: [
      { Type: "TERM_MATCH", Field: "productFamily", Value: "Dedicated Host" },
      { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
    ],
    MaxResults: 100
  });
  const res = await client.send(command);
  for (let i = 0; i < res.PriceList.length; i++) {
    const p = JSON.parse(res.PriceList[i]);
    if (p.product.attributes.instanceFamily && p.product.attributes.instanceFamily.includes("mac")) {
       console.log(JSON.stringify(p.product.attributes, null, 2));
       const onDemand = p.terms.OnDemand;
       if (onDemand) {
           const firstKey = Object.keys(onDemand)[0];
           const dimKey = Object.keys(onDemand[firstKey].priceDimensions)[0];
           console.log(`Price: $${onDemand[firstKey].priceDimensions[dimKey].pricePerUnit.USD}`);
       }
    }
  }
}

queryMac();

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
  
  let nextToken = undefined;
  do {
      const command = new GetProductsCommand({
        ServiceCode: "AmazonEC2",
        Filters: [
          { Type: "TERM_MATCH", Field: "productFamily", Value: "Dedicated Host" },
          { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
        ],
        MaxResults: 100,
        NextToken: nextToken
      });
      const res = await client.send(command);
      nextToken = res.NextToken;
      for (let i = 0; i < res.PriceList.length; i++) {
        const p = JSON.parse(res.PriceList[i]);
        const attr = p.product.attributes;
        if (JSON.stringify(attr).toLowerCase().includes("mac")) {
           console.log(`Instance Type: ${attr.instanceType} | Tenancy: ${attr.tenancy} | Processor: ${attr.physicalProcessor}`);
           const onDemand = p.terms.OnDemand;
           if (onDemand) {
               const firstKey = Object.keys(onDemand)[0];
               const dimKey = Object.keys(onDemand[firstKey].priceDimensions)[0];
               console.log(`Price: $${onDemand[firstKey].priceDimensions[dimKey].pricePerUnit.USD}`);
           }
           console.log("----");
        }
      }
  } while (nextToken);
}

queryMac();

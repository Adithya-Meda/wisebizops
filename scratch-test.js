const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");

const client = new PricingClient({ region: "us-east-1" });

async function testQuery(service, filters) {
  try {
    const command = new GetProductsCommand({
      ServiceCode: service,
      Filters: filters,
      MaxResults: 1
    });
    const response = await client.send(command);
    if (response.PriceList && response.PriceList.length > 0) {
      console.log(`Success for ${service}:`, JSON.parse(response.PriceList[0]).product.attributes);
    } else {
      console.log(`No results for ${service} with filters:`, filters);
    }
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  await testQuery("AmazonS3", [
    { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
    { Type: "TERM_MATCH", Field: "volumeType", Value: "Standard" },
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
  ]);
  
  await testQuery("AmazonS3", [
    { Type: "TERM_MATCH", Field: "productFamily", Value: "Storage" },
    { Type: "TERM_MATCH", Field: "storageClass", Value: "General Purpose" },
    { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" }
  ]);
}
main();

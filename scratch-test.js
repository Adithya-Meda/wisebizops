const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");

const client = new PricingClient({ region: "us-east-1" });

async function searchRDS() {
  try {
    const command = new GetProductsCommand({
      ServiceCode: "AmazonRDS",
      Filters: [
        { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
        { Type: "TERM_MATCH", Field: "databaseEngine", Value: "SQL Server" }
      ],
      MaxResults: 5
    });
    const response = await client.send(command);
    if (response.PriceList) {
      const items = response.PriceList.map(item => JSON.parse(item).product.attributes);
      console.log(`RDS SQL Server items:`, items);
    }
  } catch(e) { console.error(e); }
}

main = async () => { await searchRDS(); };
main();

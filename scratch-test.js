const { PricingClient, GetProductsCommand } = require("@aws-sdk/client-pricing");
const client = new PricingClient({ region: "us-east-1" });

async function check(engine, inst) {
  try {
    const command = new GetProductsCommand({
      ServiceCode: "AmazonRDS",
      Filters: [
        { Type: "TERM_MATCH", Field: "location", Value: "US East (N. Virginia)" },
        { Type: "TERM_MATCH", Field: "databaseEngine", Value: engine },
        { Type: "TERM_MATCH", Field: "instanceType", Value: inst }
      ],
      MaxResults: 1
    });
    const res = await client.send(command);
    if (res.PriceList && res.PriceList.length > 0) {
      console.log(`[${engine}] found ${inst}`);
    } else {
      console.log(`[${engine}] ${inst} NOT FOUND`);
    }
  } catch(e) {}
}

async function main() {
  await check("Aurora PostgreSQL", "db.t3.micro");
  await check("Aurora PostgreSQL", "db.t3.small");
  await check("SQL Server", "db.t3.micro");
  await check("SQL Server", "db.t3.small");
  await check("Oracle", "db.t3.micro");
  await check("Oracle", "db.t3.small");
}
main();

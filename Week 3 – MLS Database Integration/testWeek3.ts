import { getSoldComps } from "./soldComps";

async function run() {
  const results = await getSoldComps("Irvine", 12);

  for (const home of results.slice(0, 5)) {
    console.log(`
🏠 ${home.UnparsedAddress}
📍 ${home.City}
💰 Sold: $${home.ClosePrice?.toLocaleString()}
📅 Closed: ${home.CloseDate}
🛏 ${home.BedroomsTotal} beds | 🛁 ${home.BathroomsTotalInteger} baths | 📐 ${home.LivingArea} sqft
🏢 ${home.ListOfficeName}
`);
  }
}

run();

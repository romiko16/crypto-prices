const { Client } = require('pg');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'romiko2009',
  port: 5432,
});

client.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Connection error:", err.message));

async function fetchFuturesPrices() {
  try {
    const res = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
    const data = await res.json();
    const time = new Date();

    const usdtPairs = data.filter(item => item.symbol.endsWith("USDT"));

    for (const coin of usdtPairs) {
      const coinName = coin.symbol.replace("USDT", "");
      const price = parseFloat(coin.markPrice);

      await client.query(
        'INSERT INTO crypto_prices (symbol, price, time) VALUES ($1, $2, $3)',
        [coinName, price, time]
      );

      console.log(`[${time.toLocaleTimeString()}] ${coinName}: $${price}`);
    }

  } catch (err) {
    console.error("❌ Error fetching Futures data:", err.message);
  }
}

// Start loop
fetchFuturesPrices();                 // Run once immediately
setInterval(fetchFuturesPrices, 1000); // Run every second

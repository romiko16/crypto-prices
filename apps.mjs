import fetch from 'node-fetch';
import http   from 'http';

const host = process.env.QUESTDB_HOST || 'localhost';
const fetchInterval = Number(process.env.FETCH_INTERVAL_MS || '60000');

async function sendBatch() {
  const bin = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex')
                    .then(r => r.json());

  const tsNs = BigInt(Date.now()) * 1_000_000n;
  const lines =
    bin.filter(i => i.symbol.endsWith('USDT'))
       .map(i => `crypto_prices,symbol=${i.symbol.slice(0, -4)} `
               + `price=${Number(i.markPrice)} ${tsNs}`)
       .join('\n') + '\n';

  await new Promise((res, rej) => {
    const req = http.request({
      host,
      port: 9000,
      path: '/write?db=qdb&precision=ns',
      method: 'POST',
      headers: { 'Content-Type': 'text/plain',
                 'Content-Length': Buffer.byteLength(lines) }
    }, r => r.statusCode === 204 ? res() : rej(new Error('HTTP '+r.statusCode)));
    req.on('error', rej);
    req.end(lines);
  });

  console.log(`[${new Date().toLocaleTimeString()}] ✅ ingested`);
}

sendBatch();
setInterval(sendBatch, fetchInterval);

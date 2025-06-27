// package.json  →  { "type": "module" }
import fetch from 'node-fetch';
import http  from 'node:http';

async function fetchFuturesPrices () {
  try {
    const res  = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
    const json = await res.json();
    const tsNs = BigInt(Date.now()) * 1_000_000n;               // nanoseconds

    const lines = json
      .filter(i => i.symbol.endsWith('USDT'))
      .map(i => `crypto_prices,symbol=${i.symbol.slice(0,-4)} `
              + `price=${Number(i.markPrice)} ${tsNs}`)
      .join('\n') + '\n';                                       // final \n

    const req = http.request({
      host: 'localhost',
      port: 9000,
      path: '/write?db=qdb&precision=ns',                       // ← db added
      method: 'POST',
      headers: {
        'Content-Type':  'text/plain',
        'Content-Length': Buffer.byteLength(lines)              // ← correct length
      }
    }, res => {
      if (res.statusCode === 204) {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ ingested`);
      } else {
        res.setEncoding('utf8');
        res.on('data', chunk => console.error(`❌ ${chunk}`));   // show error msg
      }
    });

    req.on('error', e => console.error('❌', e.message));
    req.end(lines);
  } catch (e) {
    console.error('❌', e.message);
  }
}

fetchFuturesPrices();
setInterval(fetchFuturesPrices, 60_000);

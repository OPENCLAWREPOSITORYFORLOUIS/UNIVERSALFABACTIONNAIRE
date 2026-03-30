const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Mes Sites Web\\onto universal\\ontooriginal';
const rxFiles = ['devis-rx1.html', 'devis-rx2.html', 'devis-rx3.html', 'devis-rx4.html'];
const v = Date.now();

// 1. CSS Premium - Inline version for 100% guarantee
const premiumCSS = `
<style id="premium-rx-styles">
  :root { --p: #3D8BFF; --text: #111; --bg: #fff; }
  body { background: var(--bg) !important; color: var(--text) !important; font-family: sans-serif !important; }
  .rx-config { width: 100% !important; max-width: 1200px !important; margin: 60px auto !important; background: #fff !important; padding: 40px 5% !important; border-top: 4px solid var(--p); }
  .rx-config__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
  .rx-config__title { font-size: 28px !important; font-weight: 900 !important; color: var(--text) !important; text-transform: uppercase; }
  .rx-table-group { margin-bottom: 50px; }
  .rx-table-group__title { color: var(--p) !important; font-size: 14px !important; font-weight: 900 !important; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; display: block; }
  .rx-table { width: 100% !important; border-collapse: separate; border-spacing: 0 10px; }
  .rx-table th { text-align: left; padding: 10px 20px; color: #888; font-size: 11px; text-transform: uppercase; font-weight: bold; }
  .rx-table tr { background: #fdfdfd !important; border: 1px solid #f0f0f0; transition: all 0.2s; }
  .rx-table tr:hover { background: #f8fbff !important; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
  .rx-table td { padding: 25px 20px !important; color: var(--text) !important; font-size: 15px !important; border-top: 1px solid #f9f9f9; }
  .rx-table tr td:first-child { width: 50px; text-align: center; font-weight: 900; color: var(--p); border-radius: 10px 0 0 10px; }
  .rx-table tr td:last-child { width: 140px; text-align: center; border-radius: 0 10px 10px 0; font-weight: bold; }
  .rx-base { background: #f0f0f0; color: #555; padding: 6px 15px; border-radius: 20px; font-size: 10px; font-weight: 900; }
  .rx-check { cursor: pointer; display: inline-block; }
  .rx-check input { display: none; }
  .rx-check span { width: 32px; height: 32px; border: 2px solid #ddd; border-radius: 8px; display: block; background: #fff; position: relative; }
  .rx-check input:checked + span { background: var(--p) !important; border-color: var(--p) !important; shadow: 0 4px 10px rgba(61,139,255,0.3); }
  .rx-check input:checked + span::after { content: "✔"; color: #fff; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: bold; }
  .rx-export-btn { background: #111 !important; color: #fff !important; border: none; padding: 15px 35px !important; border-radius: 50px !important; cursor: pointer; font-weight: 900; font-size: 12px; display: inline-flex; align-items: center; gap: 10px; transition: 0.3s; text-transform: uppercase; }
  .rx-export-btn:hover { background: var(--p) !important; transform: scale(1.05); }
</style>
`;

const allFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));

allFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Cache Busting for ALL files
    content = content.replace(/dist\/index\.css(\?v=\d+)?/g, `dist/index.css?v=${v}`);
    content = content.replace(/dist\/index\.js(\?v=\d+)?/g, `dist/index.js?v=${v}`);
    content = content.replace(/js\/shared-header\.js(\?v=\d+)?/g, `js/shared-header.js?v=${v}`);

    // 2. Specific styles for RX files
    if (rxFiles.includes(file)) {
        // Remove any old premium-style injections
        content = content.replace(/<style id="premium-rx-styles">[\s\S]*?<\/style>/g, '');
        // Inject fresh inline CSS
        content = content.replace('</head>', `${premiumCSS}\n</head>`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

// 3. Update create-payment.js to be more robust against blocks
const paymentApiPath = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\api\\create-payment.js';
if (fs.existsSync(paymentApiPath)) {
    let apiCode = fs.readFileSync(paymentApiPath, 'utf8');
    // Ensure we send a very "real" user agent
    apiCode = apiCode.replace(/'User-Agent': '.*'/, `'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'`);
    fs.writeFileSync(paymentApiPath, apiCode, 'utf8');
}

console.log('Cache busting and RX inline styles applied. Payment API headers updated.');

const MASTER = '0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb';
const PRIVATE = 'live_private_p7u8pol0qHEgHkRIeXEqSnsGpxn';
const TOKEN = 'zW5AiiXLIN369FqxVklO';

const invoice = {
  invoice: {
    total_amount: 500,
    description: "Validation Production"
  },
  store: { name: "Universal Fab" }
};

async function test() {
  console.log("Testing NEW Production Keys...");
  try {
    const res = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Paydunya-Master-Key': MASTER,
        'X-Paydunya-Private-Key': PRIVATE,
        'X-Paydunya-Token': TOKEN,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(invoice)
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (e) {
    console.error("Local Fetch Error:", e.message);
  }
}

test();

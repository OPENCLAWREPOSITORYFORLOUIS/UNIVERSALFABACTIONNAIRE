const MASTER = '0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb';
const PRIVATE = 'live_private_A8TCw7aemNtfNhq02hPmIr3lakz';
const TOKEN = 'yF8xggyiHoQepEH8MVJj';

async function tryPayload(name, payload) {
  console.log(`\n--- Testing Variant: ${name} ---`);
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
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body snippet:", text.substring(0, 100));
    return res.status === 200;
  } catch (e) {
    console.error("Error:", e.message);
    return false;
  }
}

async function run() {
  // Variant 1: Array items (Standard Node/Go)
  await tryPayload("Array Items", {
    invoice: {
      total_amount: 500,
      description: "Test 1",
      items: [{ name: "Item", quantity: 1, unit_price: 500, total_price: 500 }]
    },
    store: { name: "Universal Fab" }
  });

  // Variant 2: Object items (Legacy PHP style)
  await tryPayload("Object Items", {
    invoice: {
      total_amount: 500,
      description: "Test 2",
      items: { item_0: { name: "Item", quantity: 1, unit_price: 500, total_price: 500 } }
    },
    store: { name: "Universal Fab" }
  });

  // Variant 3: No items
  await tryPayload("No Items", {
    invoice: { total_amount: 500, description: "Test 3" },
    store: { name: "Universal Fab" }
  });
}

run();

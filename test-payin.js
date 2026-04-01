const MASTER = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb";
const PRIVATE = "test_private_PzeLrKxM6Iyh8k378Rh5lBQzwFx";
const TOKEN = "BE6AuxyQ1UbTQNshxF8e";

async function testPayin() {
  console.log("Testing PayDunya SANDBOX Payin (Checkout Invoice)...");
  const invoice = {
    invoice: {
      total_amount: 1000,
      description: "Test Sandbox Investment Node"
    },
    store: { name: "Universal Fab" }
  };

  try {
    // Note: sandbox-api for test mode
    const res = await fetch('https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(invoice)
    });
    
    const bodyText = await res.text();
    console.log("Status:", res.status);
    
    try {
      const data = JSON.parse(bodyText);
      console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("JSON Parse Error:", e.message);
      console.log("Body Start:", bodyText.substring(0, 500));
    }
  } catch (e) {
    console.error("Fetch Error:", e.message);
  }
}

testPayin();

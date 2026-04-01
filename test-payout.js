const MASTER = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb";
const PRIVATE = "test_private_PzeLrKxM6Iyh8k378Rh5lBQzwFx";
const TOKEN = "BE6AuxyQ1UbTQNshxF8e";

async function testPayout() {
  console.log("Testing PayDunya SANDBOX Payout (Direct Pay)...");
  
  const payload = {
    account_alias: "771111111", // Test number from doc
    amount: 1000
  };

  try {
    const res = await fetch('https://app.paydunya.com/sandbox-api/v1/direct-pay/credit-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(payload)
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

testPayout();

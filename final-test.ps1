# final-test.ps1
$MASTER = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb"

# Test Credentials
$TEST_PRIVATE = "test_private_PzeLrKxM6Iyh8k378Rh5lBQzwFx"
$TEST_TOKEN = "BE6AuxyQ1UbTQNshxF8e"

# Live Credentials
$LIVE_PRIVATE = "live_private_p7u8pol0qHEgHkRIeXEqSnsGpxn"
$LIVE_TOKEN = "zW5AiiXLIN369FqxVklO"

function Run-Test($name, $url, $private, $token, $body) {
    Write-Host "`n--- Testing $name ---" -ForegroundColor Cyan
    $headers = @{
        "Content-Type" = "application/json"
        "PAYDUNYA-MASTER-KEY" = $MASTER
        "PAYDUNYA-PRIVATE-KEY" = $private
        "PAYDUNYA-TOKEN" = $token
    }
    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body ($body | ConvertTo-Json)
        $res | ConvertTo-Json
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) { $_.ErrorDetails }
    }
}

# 1. PAYIN TEST (SANDBOX)
Run-Test "PAYIN SANDBOX" "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create" $TEST_PRIVATE $TEST_TOKEN @{
    invoice = @{ total_amount = 1000; description = "Final Sandbox Payin Test" }
    store = @{ name = "Universal Fab" }
}

# 2. PAYOUT TEST (SANDBOX)
Run-Test "PAYOUT SANDBOX" "https://app.paydunya.com/sandbox-api/v2/disburse/get-invoice" $TEST_PRIVATE $TEST_TOKEN @{
    account_alias = "771111111"
    amount = 1000
    withdraw_mode = "wave-senegal"
    callback_url = "https://universalfabsn.space/api/paydunya-ipn"
}

# 3. PAYIN TEST (LIVE)
Run-Test "PAYIN LIVE" "https://app.paydunya.com/api/v1/checkout-invoice/create" $LIVE_PRIVATE $LIVE_TOKEN @{
    invoice = @{ total_amount = 1000; description = "Final Live Payin Test" }
    store = @{ name = "Universal Fab" }
}

# 4. PAYOUT TEST (LIVE)
Run-Test "PAYOUT LIVE" "https://app.paydunya.com/api/v2/disburse/get-invoice" $LIVE_PRIVATE $LIVE_TOKEN @{
    account_alias = "771111111"
    amount = 1000
    withdraw_mode = "wave-senegal"
    callback_url = "https://universalfabsn.space/api/paydunya-ipn"
}

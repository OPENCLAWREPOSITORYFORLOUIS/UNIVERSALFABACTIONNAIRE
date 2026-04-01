$MASTER = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb"
$PRIVATE = "test_private_PzeLrKxM6Iyh8k378Rh5lBQzwFx"
$TOKEN = "BE6AuxyQ1UbTQNshxF8e"

$invoice = @{
    invoice = @{
        total_amount = 1000
        description = "Test Investment PowerShell"
    }
    store = @{
        name = "Universal Fab"
    }
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Paydunya-Master-Key" = $MASTER
    "X-Paydunya-Private-Key" = $PRIVATE
    "X-Paydunya-Token" = $TOKEN
}

Write-Host "Testing Payin (Checkout Invoice)..."
try {
    $response = Invoke-RestMethod -Uri "https://app.paydunya.com/api/v1/checkout-invoice/create" -Method Post -Headers $headers -Body $invoice
    Write-Host "Success! Response Code: $($response.response_code)"
    Write-Host "Token: $($response.token)"
    Write-Host "URL: https://app.paydunya.com/checkout/invoice/$($response.token)"
} catch {
    Write-Error "Failed! Status: $($_.Exception.Message)"
}

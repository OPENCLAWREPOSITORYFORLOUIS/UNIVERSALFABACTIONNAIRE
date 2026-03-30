$headers = @{
    "Content-Type" = "application/json"
    "PAYDUNYA-MASTER-KEY" = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb"
    "PAYDUNYA-PRIVATE-KEY" = "test_private_PzeLrKxM6Iyh8k378Rh5lBQzwFx"
    "PAYDUNYA-TOKEN" = "BE6AuxyQ1UbTQNshxF8e"
}

$body = @{
    invoice = @{
        total_amount = 500
        description = "Test Diagnostic MODE TEST"
        items = @(
            @{
                name = "Action de Test"
                quantity = 1
                unit_price = 500
                total_price = 500
            }
        )
    }
    store = @{
        name = "Universal Fab"
    }
} | ConvertTo-Json -Depth 5

Write-Host "Tentative avec les clés de TEST..." -ForegroundColor Yellow
try {
    # Note: On utilise l'URL sandbox pour tester les clés de test
    $response = Invoke-RestMethod -Uri "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create" -Method Post -Headers $headers -Body $body
    Write-Host "SUCCÈS EN MODE TEST !" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "ÉCHEC EN MODE TEST (500)" -ForegroundColor Red
    $_.Exception.Response | Format-List
}

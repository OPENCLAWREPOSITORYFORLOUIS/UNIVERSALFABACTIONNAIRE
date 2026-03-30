$headers = @{
    "Content-Type" = "application/json"
    "PAYDUNYA-MASTER-KEY" = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb"
    "PAYDUNYA-PRIVATE-KEY" = "live_private_p7u8pol0qHEgHkRIeXEqSnsGpxn"
    "PAYDUNYA-TOKEN" = "zW5AiiXLIN369FqxVklO"
}

$body = @{
    invoice = @{
        total_amount = 500
        description = "Test Diagnostic Final"
        items = @(
            @{
                name = "Action Alpha"
                quantity = 1
                unit_price = 500
                total_price = 500
            }
        )
    }
    store = @{
        name = "Universal Fab"
        website_url = "https://universalfabsn.space"
    }
} | ConvertTo-Json -Depth 5

Write-Host "Tentative Finale avec les entêtes EXACTES (Majuscules, sans X-)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://app.paydunya.com/api/v1/checkout-invoice/create" -Method Post -Headers $headers -Body $body
    Write-Host "INCROYABLE ! ÇA MARCHE !" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "TOUJOURS BLOQUÉ (500)" -ForegroundColor Red
    $_.Exception.Response | Format-List
    Write-Host "Vérifiez vos clés sur PayDunya. Si ça échoue encore avec ces entêtes, c'est que PayDunya demande une donnée encore plus précise (ex: total_price)." -ForegroundColor Yellow
}

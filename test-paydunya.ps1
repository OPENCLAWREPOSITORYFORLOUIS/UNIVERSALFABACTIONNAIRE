$headers = @{
    "Content-Type" = "application/json"
    "X-Paydunya-Master-Key" = "0XCTDsS1-wvXQ-IXk8-3JpQ-1EwiC6TntMCb"
    "X-Paydunya-Private-Key" = "live_private_p7u8pol0qHEgHkRIeXEqSnsGpxn"
    "X-Paydunya-Token" = "zW5AiiXLIN369FqxVklO"
}

$body = @{
    invoice = @{
        total_amount = 500
        description = "Test Universal Fab"
        items = @(
            @{
                name = "Investissement"
                quantity = 1
                unit_price = 500
                total_price = 500
            }
        )
    }
    store = @{
        name = "Universal Fab"
    }
    actions = @{
        cancel_url = "https://universalfabsn.space/espace-actionnaire.html?payment=cancel"
        return_url = "https://universalfabsn.space/espace-actionnaire.html?payment=success"
    }
} | ConvertTo-Json -Depth 5

Write-Host "Tentative de connexion à PayDunya (Production)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://app.paydunya.com/api/v1/checkout-invoice/create" -Method Post -Headers $headers -Body $body
    Write-Host "RÉUSSITE : Facture créée avec succès !" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "ÉCHEC DU SERVEUR PAYDUNYA (500)" -ForegroundColor Red
    $_.Exception.Response | Format-List
    Write-Host "Note: Le serveur de PayDunya a planté. Cela arrive s'il y a un conflit sur votre compte ou si la structure du JSON n'est pas acceptée." -ForegroundColor Yellow
}

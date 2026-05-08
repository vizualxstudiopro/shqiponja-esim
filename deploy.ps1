# deploy.ps1 — git push + Railway redeploy
param(
    [string]$Message = "chore: update"
)

Write-Host "==> Git commit & push..." -ForegroundColor Cyan
git add -A
git commit -m $Message
git push

Write-Host "`n==> Railway deploy (backend)..." -ForegroundColor Cyan
Push-Location backend
railway up --detach
Pop-Location

Write-Host "`nDone! Kontrollo: https://shqiponja-esim-production.up.railway.app/api/health" -ForegroundColor Green

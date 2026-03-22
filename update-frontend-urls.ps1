# PowerShell Script to Update Frontend API URLs for Production
# Run this in: D:\xampp\htdocs\www\PFE.2.0.0.0\client\

Write-Host "🔄 Updating API URLs to Railway production..." -ForegroundColor Cyan

$clientPath = "D:\xampp\htdocs\www\PFE.2.0.0.0\client"

# Check if directory exists
if (-Not (Test-Path $clientPath)) {
    Write-Host "❌ Client directory not found: $clientPath" -ForegroundColor Red
    exit 1
}

Set-Location $clientPath

# Find all HTML and JS files
$files = Get-ChildItem -Path . -Include *.html,*.js -Recurse -File

$replacements = @(
    @{
        Old = 'http://localhost:5000'
        New = 'https://darlink-production.up.railway.app'
    },
    @{
        Old = 'http://localhost/www/PFE/client'
        New = 'https://darlink-production.up.railway.app'
    },
    @{
        Old = 'http://localhost/www/PFE/Client'
        New = 'https://darlink-production.up.railway.app'
    }
)

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($replacement in $replacements) {
        $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "✅ Updated $totalChanges file(s)" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes with: git diff" -ForegroundColor White
Write-Host "2. Test locally by opening client/index.html" -ForegroundColor White
Write-Host "3. Commit: git add client/" -ForegroundColor White
Write-Host "4. Commit: git commit -m `"Update frontend URLs for production`"" -ForegroundColor White
Write-Host "5. Push: git push" -ForegroundColor White
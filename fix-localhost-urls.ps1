# PowerShell script to replace all hardcoded localhost:5000 URLs with environment variable

$files = Get-ChildItem -Path "frontend/src" -Include *.ts,*.tsx -Recurse

$pattern1 = "fetch\('http://localhost:5000/api/"
$replacement1 = "fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/"

$pattern2 = 'fetch\("http://localhost:5000/api/'
$replacement2 = 'fetch(`${import.meta.env.VITE_API_URL || ''http://localhost:5000/api''}/'

$pattern3 = "fetch\(`http://localhost:5000/api/"
$replacement3 = "fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/"

$pattern4 = "const BACKEND_URL = 'http://localhost:5000';"
$replacement4 = "const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';"

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace patterns
    $content = $content -replace [regex]::Escape($pattern1), $replacement1
    $content = $content -replace [regex]::Escape($pattern2), $replacement2
    $content = $content -replace [regex]::Escape($pattern3), $replacement3
    $content = $content -replace [regex]::Escape($pattern4), $replacement4
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $count++
    }
}

Write-Host "`nTotal files updated: $count"

# Script to clean CSS files: Remove comments and ensure 2 blank lines between rules

$cssFiles = Get-ChildItem -Path "css" -Filter "*.css"

foreach ($file in $cssFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove all comments /* ... */
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    
    # Remove trailing whitespace from each line
    $content = $content -replace '[ \t]+$', ''
    
    # Normalize line endings to `n
    $content = $content -replace '\r\n', "`n"
    
    # Remove more than 3 consecutive newlines (leaving max 2 blank lines)
    $content = $content -replace '\n{4,}', "`n`n`n"
    
    # Ensure exactly 2 blank lines between top-level rules
    # Pattern: closing brace, optional whitespace, then a new selector or @media
    $content = $content -replace '}\s*\n+\s*(?=[.#@a-zA-Z\[])', "}`n`n`n"
    
    # Remove leading blank lines
    $content = $content -replace '^\s+', ''
    
    # Ensure file ends with single newline
    $content = $content.TrimEnd() + "`n"
    
    # Save cleaned content
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "  ✓ Cleaned" -ForegroundColor Green
}

Write-Host "`n✓ Done! Processed $($cssFiles.Count) CSS files." -ForegroundColor Green
Write-Host "Backup available in: css_backup\" -ForegroundColor Cyan

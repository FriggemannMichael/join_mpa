# PowerShell script to remove comments from CSS files and ensure 2 blank lines between rules

$cssFiles = Get-ChildItem -Path "css" -Filter "*.css" -Recurse

foreach ($file in $cssFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove single-line comments (/* ... */)
    $content = $content -replace '/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', ''
    
    # Remove multiple consecutive blank lines (more than 2)
    $content = $content -replace '(\r?\n){4,}', "`n`n`n"
    
    # Add two blank lines between top-level CSS rules
    # Match: } followed by optional whitespace and then a selector or @media
    $content = $content -replace '}\s*\n\s*(?=[.#@a-zA-Z\[])', "}`n`n`n"
    
    # Remove leading/trailing whitespace
    $content = $content.Trim()
    
    # Save back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "  ✓ Cleaned: $($file.Name)"
}

Write-Host "`nDone! Processed $($cssFiles.Count) CSS files."

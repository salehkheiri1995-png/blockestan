$ErrorActionPreference = 'Continue'
$adb = "C:\Android\Sdk\platform-tools\adb.exe"
$apk = "C:\Users\Administrator\Documents\GitHub\blockestan\release\blockestan-1.0.0.apk"

Write-Host "Waiting for boot..."
$booted = $false
for ($i = 0; $i -lt 300; $i++) {
    $state = (& $adb -e get-state 2>$null | Out-String).Trim()
    if ($state -eq "device") {
        $b = (& $adb -e shell getprop sys.boot_completed 2>$null | Out-String).Trim()
        if ($b -eq "1") { $booted = $true; break }
    }
    Start-Sleep -Seconds 5
}
if (-not $booted) {
    Write-Host "BOOT TIMEOUT"
    & $adb -e devices
    exit 1
}
Write-Host "Booted."

Write-Host "Installing APK..."
& $adb -e install -r $apk
Write-Host "Install exit: $LASTEXITCODE"

Write-Host "Launching app..."
& $adb -e logcat -c
& $adb -e shell am start -n ir.blockestan.game/.MainActivity
Start-Sleep -Seconds 15

Write-Host "=== FATAL / AndroidRuntime / crash log ==="
& $adb -e logcat -d -v threadtime 2>$null | Select-String "FATAL|AndroidRuntime|blockestan|Tapsell|Exception" | Select-Object -First 80 | ForEach-Object { $_.Line }
Write-Host "=== END ==="

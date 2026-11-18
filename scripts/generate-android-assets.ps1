# Generates Android launcher icons and splash screens from the game artwork.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\generate-android-assets.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$res = Join-Path $root 'android\app\src\main\res'
$iconPath = Join-Path $root 'design\blockestan-icon.png'
if (-not (Test-Path $iconPath)) { $iconPath = Join-Path $root 'public\favicon.png' }
$adaptivePath = Join-Path $root 'design\blockestan-adaptive.png'
if (-not (Test-Path $adaptivePath)) { $adaptivePath = $iconPath }
$mascotPath = Join-Path $root 'src\assets\images\blockestan_hero_mascot_1794865543635.jpg'

function New-Canvas([int]$w, [int]$h, [System.Drawing.Color]$background) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear($background)
    return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Png($bmp, [string]$path) {
    $dir = Split-Path -Parent $path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-RoundedPath([System.Drawing.RectangleF]$rect, [single]$radius) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $p.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $p.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $p.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $p.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

$icon = [System.Drawing.Image]::FromFile($iconPath)
$adaptive = [System.Drawing.Image]::FromFile($adaptivePath)
$bg = [System.Drawing.ColorTranslator]::FromHtml('#063B35')

# --- Legacy launcher icons -------------------------------------------------
$densities = @{ 'mdpi' = 48; 'hdpi' = 72; 'xhdpi' = 96; 'xxhdpi' = 144; 'xxxhdpi' = 192 }
foreach ($d in $densities.Keys) {
    $size = $densities[$d]

    $c = New-Canvas $size $size ([System.Drawing.Color]::Transparent)
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $path = New-RoundedPath $rect ([single]($size * 0.22))
    $c.Graphics.SetClip($path)
    $c.Graphics.DrawImage($icon, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    Save-Png $c.Bitmap (Join-Path $res "mipmap-$d\ic_launcher.png")
    $path.Dispose(); $c.Graphics.Dispose(); $c.Bitmap.Dispose()

    $c = New-Canvas $size $size ([System.Drawing.Color]::Transparent)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $c.Graphics.SetClip($path)
    $c.Graphics.DrawImage($icon, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
    Save-Png $c.Bitmap (Join-Path $res "mipmap-$d\ic_launcher_round.png")
    $path.Dispose(); $c.Graphics.Dispose(); $c.Bitmap.Dispose()

    # Adaptive background layer: 108dp full-bleed artwork. The launcher applies its own mask;
    # the block cluster sits inside the 66dp safe zone.
    $fw = [int]($size * 2.25)
    $c = New-Canvas $fw $fw $bg
    $c.Graphics.DrawImage($adaptive, (New-Object System.Drawing.Rectangle(0, 0, $fw, $fw)))
    Save-Png $c.Bitmap (Join-Path $res "mipmap-$d\ic_launcher_bg.png")
    $c.Graphics.Dispose(); $c.Bitmap.Dispose()

    $unused = Join-Path $res "mipmap-$d\ic_launcher_foreground.png"
    if (Test-Path $unused) { Remove-Item $unused -Force }
}

# --- Splash screens --------------------------------------------------------
$mascot = [System.Drawing.Image]::FromFile($mascotPath)
$splashes = @(
    @{ File = 'drawable\splash.png'; W = 480; H = 320 },
    @{ File = 'drawable-port-mdpi\splash.png'; W = 320; H = 480 },
    @{ File = 'drawable-port-hdpi\splash.png'; W = 480; H = 800 },
    @{ File = 'drawable-port-xhdpi\splash.png'; W = 720; H = 1280 },
    @{ File = 'drawable-port-xxhdpi\splash.png'; W = 960; H = 1600 },
    @{ File = 'drawable-port-xxxhdpi\splash.png'; W = 1280; H = 1920 },
    @{ File = 'drawable-land-mdpi\splash.png'; W = 480; H = 320 },
    @{ File = 'drawable-land-hdpi\splash.png'; W = 800; H = 480 },
    @{ File = 'drawable-land-xhdpi\splash.png'; W = 1280; H = 720 },
    @{ File = 'drawable-land-xxhdpi\splash.png'; W = 1600; H = 960 },
    @{ File = 'drawable-land-xxxhdpi\splash.png'; W = 1920; H = 1280 }
)
foreach ($s in $splashes) {
    $w = $s.W; $h = $s.H
    $c = New-Canvas $w $h $bg
    $side = [int]([Math]::Min($w, $h) * 0.52)
    $x = [int](($w - $side) / 2)
    $y = [int](($h - $side) / 2)
    $rect = New-Object System.Drawing.RectangleF($x, $y, $side, $side)
    $path = New-RoundedPath $rect ([single]($side * 0.22))
    $c.Graphics.SetClip($path)
    $c.Graphics.DrawImage($mascot, $rect)
    $c.Graphics.ResetClip()
    Save-Png $c.Bitmap (Join-Path $res $s.File)
    $path.Dispose(); $c.Graphics.Dispose(); $c.Bitmap.Dispose()
}

$mascot.Dispose()
$adaptive.Dispose()
$icon.Dispose()
Write-Host "Android icons and splash screens generated (background #$('{0:X2}{1:X2}{2:X2}' -f $bg.R, $bg.G, $bg.B))."

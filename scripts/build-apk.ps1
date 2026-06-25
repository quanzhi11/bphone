# Booxin 手机版 Release APK 打包脚本
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $root "android"
$assetsDir = Join-Path $root "assets\images"
$pcIcon = "d:\all code in D\booxin-launcher2.3.0\booxin launcher\Resources\Images\booxin_glass_icon.png"

if (-not $env:JAVA_HOME) {
  $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.8.9-hotspot"
}
if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "D:\AndroidSDK"
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
Add-Type -AssemblyName System.Drawing
$size = 1024
$padding = 72
$bg = [System.Drawing.Color]::FromArgb(255, 15, 25, 35)
function Save-SquareIcon([string]$dest) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($bg)
  $srcImg = [System.Drawing.Image]::FromFile($pcIcon)
  $target = $size - 2 * $padding
  $scale = [Math]::Min($target / $srcImg.Width, $target / $srcImg.Height)
  $w = [int]($srcImg.Width * $scale)
  $h = [int]($srcImg.Height * $scale)
  $x = [int](($size - $w) / 2)
  $y = [int](($size - $h) / 2)
  $g.DrawImage($srcImg, $x, $y, $w, $h)
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $srcImg.Dispose()
}
@("icon.png", "android-icon-foreground.png", "splash-icon.png", "favicon.png") | ForEach-Object {
  Save-SquareIcon (Join-Path $assetsDir $_)
}

Push-Location $root
npx expo prebuild --platform android --clean
Pop-Location

$sdkDir = $env:ANDROID_HOME -replace "\\", "/"
"sdk.dir=$($sdkDir -replace ':', '\:')" | Set-Content -Encoding ASCII (Join-Path $androidDir "local.properties")

Push-Location $androidDir
.\gradlew.bat assembleRelease
Pop-Location

$apk = Get-ChildItem -Path (Join-Path $androidDir "app\build\outputs\apk\release") -Filter "*.apk" | Select-Object -First 1
if ($apk) {
  $outDir = Join-Path $root "dist"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $outApk = Join-Path $outDir "BooxinMobile-release.apk"
  Copy-Item $apk.FullName $outApk -Force
  Write-Host "APK: $outApk"
} else {
  throw "Release APK not found"
}

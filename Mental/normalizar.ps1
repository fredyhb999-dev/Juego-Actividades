$root   = "C:\Users\Fred\Documents\GitHub\Juego-Actividades\Mental"
$marker = "NORMALIZADO v2 I=-16 TP=-1.5"

$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter *.mp3 |
         Where-Object { $_.Name -notlike "*.tmp.mp3" -and $_.Length -gt 0 }

$total = $files.Count
$i = 0
$done = 0
$skipped = 0
$failed = 0

foreach($f in $files){
  $i++

  $meta = ""
  try {
    $meta = (& ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate:format_tags=comment -of default=nw=1 "$($f.FullName)" 2>$null) -join "`n"
  } catch {}

  if($meta.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0){
    $skipped++
    continue
  }

  $sr = "44100"
  if($meta -match 'sample_rate=(\d+)'){ $sr = $matches[1] }

  $rel = $f.FullName.Substring($root.Length).TrimStart('\')
  Write-Host "[$i/$total] $rel"

  $m = & ffmpeg -hide_banner -nostats -i "$($f.FullName)" -af "loudnorm=I=-16:TP=-1.5:print_format=json" -f null NUL 2>&1 | Out-String
  if($m -notmatch '(?s)\{.*?"input_i".*?\}'){
    $failed++
    Write-Host "  ERROR medicion: $rel"
    continue
  }
  $j = $matches[0] | ConvertFrom-Json
  $ii = 0.0
  if(-not [double]::TryParse([string]$j.input_i, [ref]$ii)){
    $failed++
    Write-Host "  ERROR loudness no valido: $rel"
    continue
  }

  $gain = [math]::Round(-16.0 - $ii, 2)
  if($gain -gt 0){
    $af = "volume=${gain}dB,aresample=176400,alimiter=limit=0.841:level=false,aresample=$sr"
  } else {
    $af = "volume=${gain}dB"
  }

  $tmp = "$($f.FullName).tmp.mp3"
  if(Test-Path -LiteralPath $tmp){ Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }

  & ffmpeg -hide_banner -loglevel error -nostdin -i "$($f.FullName)" `
    -map 0:a -af $af `
    -map_metadata 0 -metadata comment="$marker" `
    -c:a libmp3lame -q:a 2 "$tmp" 2>$null

  if($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $tmp) -and ((Get-Item -LiteralPath $tmp).Length -gt 0)){
    Move-Item -LiteralPath $tmp -Destination $f.FullName -Force
    $done++
  } else {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    $failed++
    Write-Host "  ERROR: $rel"
  }
}

Write-Host ""
Write-Host "Procesados: $done | Saltados: $skipped | Fallidos: $failed | Total: $total"

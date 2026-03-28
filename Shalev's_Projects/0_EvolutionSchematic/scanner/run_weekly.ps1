# Schematic Evolution — Weekly Scanner Runner
# Runs every Sunday at 11:00 IL time (set via Windows Task Scheduler)
# Schedule: Sunday 11:00 Israel Time = Sunday 08:00 UTC

Set-Location "e:\Claude"

$LogFile = "e:\Claude\Shalev's_Projects\0_EvolutionSchematic\scanner\scan.log"
$Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$Date] Starting weekly scan..."
Add-Content $LogFile "[$Date] Starting weekly scan..."

# Run scanner
python "e:\Claude\Shalev's_Projects\0_EvolutionSchematic\scanner\scan_system.py"

if ($LASTEXITCODE -ne 0) {
    $Err = "[$Date] ERROR: scan_system.py failed with code $LASTEXITCODE"
    Write-Host $Err
    Add-Content $LogFile $Err
    exit 1
}

$DateStr = Get-Date -Format "yyyy-MM-dd"
$CommitMsg = "feat: weekly schematic snapshot $DateStr [auto]"

# Git operations
git add "Shalev's_Projects/0_EvolutionSchematic/data/"
git commit -m $CommitMsg
git push origin master

if ($LASTEXITCODE -eq 0) {
    $OK = "[$Date] Push successful"
    Write-Host $OK
    Add-Content $LogFile $OK
} else {
    $Warn = "[$Date] WARNING: git push failed (code $LASTEXITCODE)"
    Write-Host $Warn
    Add-Content $LogFile $Warn
}

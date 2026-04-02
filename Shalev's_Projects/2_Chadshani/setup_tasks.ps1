# Chadshani — Windows Task Scheduler Setup
# Run as Administrator once to register both daily tasks.
# Tasks replace GitHub Actions cron (removed 2026-04-02).

$PythonExe = (Get-Command python).Source
$Script    = "E:\Claude\Shalev's_Projects\2_Chadshani\chadshani_auto.py"
$LogDir    = "E:\Claude\Shalev's_Projects\2_Chadshani\logs"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

# Verify GEMINI_API_KEY is set as a machine/user env var
if (-not $env:GEMINI_API_KEY) {
    Write-Warning "GEMINI_API_KEY is not set. Tasks will be registered but won't work until key is set."
    Write-Host "After setup, run: [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY','YOUR_KEY','User')"
}

$Action = New-ScheduledTaskAction `
    -Execute $PythonExe `
    -Argument $Script `
    -WorkingDirectory "E:\Claude"

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -RunOnlyIfNetworkAvailable

# Task 1: 06:45 daily (15min before 07:00 IL)
$Trigger1 = New-ScheduledTaskTrigger -Daily -At "06:45"
Register-ScheduledTask `
    -TaskName   "Chadshani-0645" `
    -Action     $Action `
    -Trigger    $Trigger1 `
    -Settings   $Settings `
    -RunLevel   Highest `
    -Force | Out-Null
Write-Host "[OK] Chadshani-0645 registered"

# Task 2: 18:45 daily (15min before 19:00 IL)
$Trigger2 = New-ScheduledTaskTrigger -Daily -At "18:45"
Register-ScheduledTask `
    -TaskName   "Chadshani-1845" `
    -Action     $Action `
    -Trigger    $Trigger2 `
    -Settings   $Settings `
    -RunLevel   Highest `
    -Force | Out-Null
Write-Host "[OK] Chadshani-1845 registered"

Write-Host ""
Write-Host "Tasks registered. Verify with: schtasks /query /tn Chadshani-0645 /fo LIST"

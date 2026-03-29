# Setup Windows Task Scheduler — Weekly Sunday 11:00 IL (08:00 UTC)
# Run as Administrator once to register the task

$TaskName = "SchematicEvolution_WeeklyScanner"
$ScriptPath = "e:\Claude\Shalev's_Projects\0_EvolutionSchematic\scanner\run_weekly.ps1"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Trigger: Every Sunday at 11:00 (adjust timezone — Windows uses local time)
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "11:00AM"

# Action: Run PowerShell with the script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Run whether user is logged on or not, with highest privileges
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType S4U `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskName `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -Principal $principal `
    -Description "Weekly Claude system scanner — runs scan_system.py and pushes snapshot.json to GitHub"

Write-Host "Task registered: $TaskName"
Write-Host "Runs every Sunday at 11:00 AM local time"
Write-Host ("To test immediately: Start-ScheduledTask -TaskName " + $TaskName)

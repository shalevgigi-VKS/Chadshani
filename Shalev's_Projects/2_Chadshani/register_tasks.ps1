$py = (Get-Command python).Source
$script = "E:\Claude\Shalev's_Projects\2_Chadshani\chadshani_auto.py"
$cmd = "`"$py`" `"$script`""

schtasks /create /tn "Chadshani-0645" /tr $cmd /sc daily /st 06:45 /f
schtasks /create /tn "Chadshani-1845" /tr $cmd /sc daily /st 18:45 /f

Write-Host "Verify:"
schtasks /query /tn "Chadshani-0645" /fo LIST
schtasks /query /tn "Chadshani-1845" /fo LIST

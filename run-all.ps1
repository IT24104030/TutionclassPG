param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mvnPath = 'C:\maven\apache-maven-3.9.4\bin\mvn.cmd'

if (-not (Test-Path $mvnPath)) {
    throw "Maven not found at $mvnPath"
}

function Stop-PortProcess {
    param([int]$Port)
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listeners) {
        $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidValue in $pids) {
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process on port $Port (PID $pidValue)" -ForegroundColor Yellow
        }
    }
}

Write-Host 'Preparing environment...' -ForegroundColor Cyan
Stop-PortProcess -Port 8080
Stop-PortProcess -Port 3000

$backendCommand = "Set-Location '$root'; & '$mvnPath' -f backend\\pom.xml spring-boot:run"
$frontendCommand = "Set-Location '$root'; python -m http.server 3000 --directory frontend"

Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $backendCommand) | Out-Null
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $frontendCommand) | Out-Null

Write-Host 'Starting backend and frontend...' -ForegroundColor Green
Start-Sleep -Seconds 4

if (-not $NoBrowser) {
    Start-Process 'http://localhost:3000/index.html'
}

Write-Host ''
Write-Host 'Run complete.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000/index.html'
Write-Host 'Backend : http://localhost:8080/api'
Write-Host 'Login   : admin / Admin@123'

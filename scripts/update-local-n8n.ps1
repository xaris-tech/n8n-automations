param(
  [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

$containerName = "n8n"
$volumeName = "n8n_data"
$image = "n8nio/n8n:$ImageTag"
$backupRoot = Join-Path (Get-Location) ".scratch\backups"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "n8n_data_$stamp.tgz"

New-Item -ItemType Directory -Force $backupRoot | Out-Null

Write-Host "Backing up Docker volume $volumeName..."
docker run --rm -v "${volumeName}:/data" -v "${backupRoot}:/backup" alpine sh -c "cd /data && tar czf /backup/$backupName ."

Write-Host "Pulling $image..."
docker pull $image

$runningContainer = docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"
if ($runningContainer -eq $containerName) {
  Write-Host "Stopping existing $containerName container..."
  docker stop $containerName | Out-Null
  docker rm $containerName | Out-Null
}

Write-Host "Starting $containerName with $image..."
docker run -d `
  --name $containerName `
  --restart unless-stopped `
  -p 5678:5678 `
  -v "${volumeName}:/home/node/.n8n" `
  $image | Out-Null

Write-Host "Installed n8n version:"
docker exec $containerName n8n --version

Write-Host "Checking http://localhost:5678/healthz ..."
$status = $null
for ($attempt = 1; $attempt -le 6; $attempt++) {
  try {
    $status = (Invoke-WebRequest -UseBasicParsing http://localhost:5678/healthz -TimeoutSec 20).StatusCode
    break
  } catch {
    if ($attempt -eq 6) {
      throw
    }

    Start-Sleep -Seconds 5
  }
}

Write-Host "HTTP status: $status"
Write-Host "Backup saved to: $backupRoot\$backupName"

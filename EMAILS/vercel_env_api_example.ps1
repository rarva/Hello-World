Param()
# Vercel API example: set environment variables using VERCEL_TOKEN and PROJECT_ID
# Usage (PowerShell):
#   $env:VERCEL_TOKEN = 'your-vercel-token'
#   $projectId = '<PROJECT_ID>'
#   $sendgrid = Read-Host -Prompt 'SENDGRID_API_KEY (paste hidden)' -AsSecureString
#   $sendgridPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sendgrid))
#   # Then run the command below (replace values)

function Add-VercelEnvVar {
    param(
        [string]$projectId,
        [string]$key,
        [string]$value,
        [string[]]$targets = @('production')
    )

    if (-not $env:VERCEL_TOKEN) {
        Write-Error 'Please set $env:VERCEL_TOKEN to a Vercel personal token before running.'
        return
    }

    $payload = @{ key = $key; value = $value; target = $targets } | ConvertTo-Json

    $uri = "https://api.vercel.com/v9/projects/$projectId/env"
    $res = Invoke-RestMethod -Uri $uri -Method Post -Headers @{ Authorization = "Bearer $env:VERCEL_TOKEN" } -Body $payload -ContentType 'application/json'
    return $res
}

# Example usage (uncomment and replace):
# $projectId = '<PROJECT_ID>'
# Add-VercelEnvVar -projectId $projectId -key 'SENDGRID_API_KEY' -value 'SG.YOUR_NEW_KEY' -targets @('production')
# Add-VercelEnvVar -projectId $projectId -key 'EMAIL_FROM' -value 'Rhomberg OrgChart <no-reply@yourdomain.com>' -targets @('production')
# Add-VercelEnvVar -projectId $projectId -key 'SUPABASE_URL' -value 'https://your-project.supabase.co' -targets @('production')

Write-Output 'Script created. Uncomment and fill $projectId, then run the Add-VercelEnvVar calls.'

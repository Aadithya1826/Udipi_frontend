$ErrorActionPreference = "Stop"

Write-Host "Adding files..."
git add .

Write-Host "Committing changes..."
if (git status --porcelain) {
    git commit -m "update frontend code"
} else {
    Write-Host "Nothing to commit locally."
}

Write-Host "Renaming current branch to deployment so push works..."
git branch -m deployment

Write-Host "Adding remote if not exists..."
# Replace this URL with your desired target repository
$remoteUrl = "https://github.com/Aadithya1826/Udipi_frontend.git"
try {
    git remote add origin $remoteUrl
} catch {
    git remote set-url origin $remoteUrl
}

Write-Host "Pushing to deployment branch..."
git push origin deployment

Write-Host "Done!"

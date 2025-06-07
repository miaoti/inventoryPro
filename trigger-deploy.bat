@echo off
echo 🚀 Triggering GitHub Actions deployment...

echo.
echo This will trigger the GitHub Actions workflow to deploy your changes.
echo Make sure you have:
echo ✅ Committed and pushed your changes to the main branch
echo ✅ GitHub secrets are properly configured
echo ✅ Self-hosted runner is online

echo.
set /p confirm="Continue with deployment trigger? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Deployment cancelled.
    pause
    exit /b
)

echo.
echo 📋 Checking git status...
git status --porcelain
if %errorlevel% neq 0 (
    echo ❌ Git error. Please check your repository.
    pause
    exit /b
)

echo.
echo 📤 Pushing to main branch...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Push failed. Please check your git configuration.
    pause
    exit /b
)

echo.
echo 🎯 Triggering GitHub Actions workflow...
gh workflow run deploy.yml
if %errorlevel% neq 0 (
    echo ❌ Failed to trigger workflow. Make sure GitHub CLI is installed and authenticated.
    echo.
    echo To install GitHub CLI: https://cli.github.com/
    echo To authenticate: gh auth login
    pause
    exit /b
)

echo.
echo ✅ GitHub Actions workflow triggered successfully!
echo.
echo 🔍 You can monitor the deployment at:
echo https://github.com/miaoti/inventoryPro/actions
echo.
echo 📊 Or use: gh run list
echo 📝 To view logs: gh run view --log

pause 
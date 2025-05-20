@echo off
echo ============================================
echo Cleaning Git history: Removing secrets
echo ============================================

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Step 1: Check for BFG jar
if not exist bfg-1.15.0.jar (
    echo ERROR: bfg-1.15.0.jar not found in this folder.
    pause
    exit /b
)

:: Step 2: Remove sensitive file from Git history using BFG
java -jar bfg-1.15.0.jar --delete-files firebase-service-account.json

:: Step 3: Expire old references and clean repo
git reflog expire --expire=now --all
git gc --prune=now --aggressive

:: Step 4: Stage any remaining changes (if necessary)
git add -A
git commit -m "Removed firebase-service-account.json from history" || echo No changes to commit.

:: Step 5: Force push the cleaned history
git push origin main --force

echo.
echo ✅ Cleanup complete. Verify on GitHub.
pause 
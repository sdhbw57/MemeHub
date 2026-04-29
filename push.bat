@echo off
cd /d e:\项目\tuzhan\project
git config user.email "sdhbw57@example.com"
git config user.name "sdhbw57"
git add -A
git commit -m "Initial commit: MemeHub image hosting system"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/sdhbw57/MemeHub.git
git push -u origin main
pause

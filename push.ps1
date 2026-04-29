# MemeHub GitHub 推送脚本
Write-Host "=== MemeHub 推送脚本 ===" -ForegroundColor Cyan

# 进入项目目录
Set-Location "e:\项目\tuzhan\project"

# 配置 Git
git config user.email "sdhbw57@example.com"
git config user.name "sdhbw57"

# 添加文件
git add -A

# 提交
git commit -m "Initial commit: MemeHub"

# 切换到 main 分支
git branch -M main

# 添加远程仓库
git remote remove origin 2>$null
git remote add origin https://github.com/sdhbw57/MemeHub.git

# 推送
git push -u origin main

Write-Host "=== 完成 ===" -ForegroundColor Green

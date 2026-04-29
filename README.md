# MemeHub - 高性能图片托管与表情包画廊

> 一个可以支持大量图片、高并发访问、加载速度快的图站系统，适合表情包、图片分享和直链访问。

**项目地址**: https://github.com/sdhbw57/MemeHub

## 功能特性

- **图片上传**: 支持 JPG/PNG/GIF/WEBP 格式，最大 5MB，UUID 命名防冲突
- **缩略图生成**: 自动使用 Sharp 生成 300x300 缩略图，加速页面加载
- **URL 加密**: AES-256-CBC 加密图片链接，防止直接爬取和盗链
- **分类管理**: 8 个预设分类（搞笑、动漫、游戏、斗图等），支持按分类筛选
- **搜索功能**: 支持按图片名称搜索
- **分享链接**: 支持直链、Markdown、HTML、BBCode 多种格式
- **Redis 缓存**: 热门图片和分类数据缓存，减轻数据库压力
- **响应式 UI**: 磨砂玻璃主题，移动端优先设计
- **AI API**: 专为 AI 调用优化的简洁 API 端点

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
cd server
npm install

# 2. 启动 Redis（Windows 需提前安装）
redis-server

# 3. 启动服务
npm start

# 访问 http://localhost:3000
```

### Docker 部署

```bash
# 使用 docker-compose 一键部署
docker-compose up -d
```

## 更新日志

### v1.2.0 (2026-04-29)

**新增**
- 新增 AI 专用 API 工具，提供 4 个简洁端点
  - `GET /api/tools/search` - 搜索图片
  - `GET /api/tools/categories` - 获取所有分类
  - `GET /api/tools/popular` - 获取热门图片
  - `GET /api/tools/image/:id` - 获取单张图片详情
- 所有 API 返回统一格式 `success: true/false`
- 支持分页参数（limit + offset）

**优化**
- 修复缩略图 URL 加密逻辑
- 图片流传输改用 `createReadStream` 替代 `sendFile`
- 前端增加 3 次自动重试机制
- API 请求禁用缓存，确保数据实时性

**修复**
- 修复首页分类加载失败问题
- 修复图片 404 错误
- 修复缩略图不显示问题

### v1.1.0 (2026-04-29)

**新增**
- URL 加密功能（AES-256-CBC）
- 流式文件传输支持
- 文件存在性检查

### v1.0.0 (2026-04-29)

**首次发布**
- 图片上传与管理
- 分类系统
- 搜索与分页
- 缩略图生成
- 磨砂玻璃 UI 主题
- Redis 缓存
- Nginx 配置
- 完整部署文档

## AI API 使用

所有 API 返回 JSON 格式，AI 可直接解析使用：

```bash
# 搜索图片
curl "http://localhost:3000/api/tools/search?q=猫咪&limit=10"

# 获取分类列表
curl "http://localhost:3000/api/tools/categories"

# 获取热门图片
curl "http://localhost:3000/api/tools/popular?limit=10"

# 获取图片详情
curl "http://localhost:3000/api/tools/image/图片ID"
```

返回示例：
```json
{
  "success": true,
  "total": 4,
  "count": 4,
  "images": [
    {
      "id": "ea8acf4e-ed19-4443-9411-1cbb7c0d4cf9",
      "name": "R.jfif",
      "category": "未分类",
      "width": 800,
      "height": 944,
      "views": 0,
      "thumbnailUrl": "http://localhost:3000/t/加密缩略图ID",
      "directUrl": "http://localhost:3000/i/加密图片ID.jpg"
    }
  ],
  "has_more": false
}
```

---

## 系统要求

- Linux (Ubuntu 20.04+ / CentOS 7+)
- Node.js 18+
- MySQL 5.7+ / MySQL 8.0+
- Redis 6.0+
- Nginx 1.18+
- 至少 2GB 内存

## 部署步骤

### 1. 安装系统依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git build-essential nginx mysql-server redis-server

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl git gcc-c++ make nginx mysql-server redis
```

### 2. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 配置 MySQL

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全初始化
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p << EOF
CREATE DATABASE image_hosting DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'imageuser'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON image_hosting.* TO 'imageuser'@'localhost';
FLUSH PRIVILEGES;
EOF

# 导入数据表结构
mysql -u imageuser -p image_hosting < database/init.sql
```

### 4. 配置 Redis

```bash
# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis

# 可选: 设置 Redis 密码
sudo nano /etc/redis/redis.conf
# 添加: requirepass your_redis_password

# 重启 Redis
sudo systemctl restart redis
```

### 5. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /var/www/imagehosting
sudo chown -R $USER:$USER /var/www/imagehosting

# 上传项目文件
cd /var/www/imagehosting
# 上传项目代码到此目录

# 安装依赖
cd server
npm install --production

# 配置环境变量
cp ../.env.example .env
nano .env
```

### 6. 使用 PM2 管理进程

```bash
sudo npm install -g pm2

# 启动应用
cd /var/www/imagehosting/server
pm2 start src/app.js --name imagehosting

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 restart imagehosting
pm2 stop imagehosting
pm2 logs imagehosting
```

### 7. 配置 Nginx

```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/imagehosting
sudo ln -s /etc/nginx/sites-available/imagehosting /etc/nginx/sites-enabled/

# 修改配置中的路径和域名
sudo nano /etc/nginx/sites-available/imagehosting

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8. 配置 SSL (推荐)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 3 * * * certbot renew --quiet
```

### 9. 设置文件权限

```bash
sudo chown -R www-data:www-data /var/www/imagehosting/uploads
sudo chown -R www-data:www-data /var/www/imagehosting/thumbnails
sudo chmod -R 755 /var/www/imagehosting/uploads
sudo chmod -R 755 /var/www/imagehosting/thumbnails
```

### 10. 防火墙配置

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 性能优化

### MySQL 优化

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加以下配置:
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
query_cache_size = 32M
max_connections = 200
```

### Redis 优化

```bash
sudo nano /etc/redis/redis.conf

# 配置:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 系统优化

```bash
# 增加文件描述符限制
sudo nano /etc/security/limits.conf
# 添加:
* soft nofile 65536
* hard nofile 65536

# 增加连接队列
sudo sysctl -w net.core.somaxconn=65535
```

## 监控和维护

### 日志查看

```bash
# 应用日志
pm2 logs imagehosting

# Nginx 日志
sudo tail -f /var/log/nginx/imagehosting_access.log
sudo tail -f /var/log/nginx/imagehosting_error.log

# MySQL 慢查询日志
sudo tail -f /var/log/mysql/mysql-slow.log
```

### 数据库备份

```bash
# 备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u imageuser -p'your_password' image_hosting | gzip > /backup/imagehosting_$DATE.sql.gz

# 设置定时任务
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

### 清理旧缓存

```bash
# 定期清理 Redis 缓存
redis-cli FLUSHDB

# 或者清理特定前缀的键
redis-cli --scan --pattern 'img:cache:*' | xargs redis-cli del
```

## 故障排除

### 常见问题

1. **端口占用**
   ```bash
   sudo lsof -i :3000
   sudo fuser -k 3000/tcp
   ```

2. **权限问题**
   ```bash
   sudo chown -R www-data:www-data uploads thumbnails
   ```

3. **数据库连接失败**
   ```bash
   mysql -u imageuser -p -h localhost
   ```

4. **Redis 连接失败**
   ```bash
   redis-cli ping
   redis-cli -a your_password ping
   ```

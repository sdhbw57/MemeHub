# 高性能图片站部署指南

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

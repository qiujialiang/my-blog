# Astro博客远程服务器迁移完整指南

## 前置要求

- 一台Linux服务器（Ubuntu/CentOS）
- 域名（可选但建议）
- 服务器root或sudo权限

## 方案一：手动部署（适合初次迁移）

### 步骤1：服务器环境准备

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统包
apt update && apt upgrade -y  # Ubuntu/Debian
# 或
yum update -y  # CentOS

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x

# 安装Git
apt install git -y

# 安装Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 步骤2：上传项目代码

**方式A：使用Git（推荐）**

```bash
# 在本地将代码推送到GitHub/GitLab
git add .
git commit -m "准备部署"
git push origin main

# 在服务器上克隆
cd /var/www
git clone https://github.com/yourusername/astro-blog.git
```

**方式B：使用SCP直接上传**

```bash
# 在本地执行
cd ~/astro-blog
scp -r . root@your-server-ip:/var/www/astro-blog/

# 或者压缩后上传
tar -czvf blog.tar.gz --exclude='node_modules' --exclude='dist' --exclude='.git' .
scp blog.tar.gz root@your-server-ip:/var/www/
ssh root@your-server-ip "cd /var/www && tar -xzvf blog.tar.gz"
```

### 步骤3：安装依赖并构建

```bash
cd /var/www/astro-blog

# 安装依赖
npm install

# 构建生产版本
npm run build

# 验证构建结果
ls -la dist/
```

### 步骤4：配置Nginx

```bash
# 创建Nginx配置文件
nano /etc/nginx/sites-available/astro-blog
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/astro-blog/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 404页面
    error_page 404 /404.html;

    # 所有路由指向index.html（支持前端路由）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/astro-blog /etc/nginx/sites-enabled/
nginx -t  # 测试配置
systemctl reload nginx
```

### 步骤5：配置SSL证书（HTTPS）

```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
certbot renew --dry-run
```

---

## 方案二：使用PM2托管（适合需要Node服务的情况）

如果你的博客需要服务端渲染（SSR）或API功能：

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > /var/www/astro-blog/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'astro-blog',
    script: './dist/server/entry.mjs',  # SSR模式
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 启动
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
```

Nginx配置改为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 方案三：Docker部署（推荐，环境隔离）

### 创建Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t astro-blog:latest .

# 运行容器
docker run -d \
  --name astro-blog \
  -p 80:80 \
  --restart unless-stopped \
  astro-blog:latest

# 查看日志
docker logs -f astro-blog
```

### Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  blog:
    build: .
    container_name: astro-blog
    restart: unless-stopped
    ports:
      - "80:80"
    networks:
      - blog-network

  # 可选：添加Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: blog-nginx
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - blog
    networks:
      - blog-network

networks:
  blog-network:
    driver: bridge
```

运行：

```bash
docker-compose up -d --build
```

---

## 方案四：CI/CD自动化部署（推荐长期使用）

### GitHub Actions配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/scp-action@v0.1.7
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        source: "dist/"
        target: "/var/www/astro-blog/"
        strip_components: 1
        
    - name: Restart Nginx
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          sudo systemctl reload nginx
```

### 配置GitHub Secrets

在GitHub仓库 Settings > Secrets and variables > Actions 中添加：

- `SERVER_HOST`: 你的服务器IP
- `SERVER_USER`: 用户名（如root）
- `SSH_PRIVATE_KEY`: 服务器私钥（`cat ~/.ssh/id_rsa`）

---

## 迁移后检查清单

```bash
# 1. 检查服务状态
systemctl status nginx
docker ps  # 如果使用Docker

# 2. 检查文件权限
ls -la /var/www/astro-blog/dist/

# 3. 测试网站访问
curl -I http://your-domain.com

# 4. 检查SSL证书
curl -I https://your-domain.com

# 5. 检查日志
journalctl -u nginx -f  # Nginx日志
tail -f /var/log/nginx/error.log
```

---

## 常见问题

### 1. 构建失败

```bash
# 清理缓存重新构建
rm -rf node_modules dist
npm install
npm run build
```

### 2. 页面刷新404

确保Nginx配置中有：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 3. 权限问题

```bash
chown -R www-data:www-data /var/www/astro-blog
chmod -R 755 /var/www/astro-blog/dist
```

### 4. 环境变量

如果使用了环境变量，在服务器上创建 `.env` 文件：

```bash
cd /var/www/astro-blog
cat > .env << 'EOF'
SITE_URL=https://your-domain.com
API_KEY=your-api-key
EOF
```

---

## 性能优化（服务器端）

```nginx
# /etc/nginx/nginx.conf
http {
    # 开启gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 开启HTTP/2
    server {
        listen 443 ssl http2;
        # ...
    }
}
```

---

## 备份策略

```bash
#!/bin/bash
# /opt/scripts/backup-blog.sh

BACKUP_DIR="/backup/blog"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份代码和构建产物
tar -czvf $BACKUP_DIR/blog_$DATE.tar.gz -C /var/www astro-blog

# 保留最近30天备份
find $BACKUP_DIR -name "blog_*.tar.gz" -mtime +30 -delete
```

添加到crontab：

```bash
crontab -e
# 每天凌晨3点备份
0 3 * * * /opt/scripts/backup-blog.sh
```

---

按照以上步骤，你的Astro博客就可以成功迁移到远程服务器并正常运行了！

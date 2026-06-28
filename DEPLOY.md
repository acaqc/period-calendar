# 月经周期日历 — 部署指南

## 🚀 快速部署（5 分钟）

项目已构建完毕，`dist/` 目录是纯静态文件，可部署到任何静态托管平台。

---

### 方案一：Vercel（推荐，最快）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录（一次性）
vercel login

# 3. 进入项目目录，一键部署
cd period-calendar
vercel --prod
```

部署后自动获得 `https://xxx.vercel.app` 域名，支持自定义域名绑定。

---

### 方案二：Cloudflare Pages

```bash
# 1. 安装 Wrangler CLI
npm i -g wrangler

# 2. 登录
wrangler login

# 3. 部署
wrangler pages deploy dist --project-name period-calendar
```

---

### 方案三：GitHub Pages

```bash
# 1. 创建 GitHub 仓库并推送
cd period-calendar
git remote add origin https://github.com/YOUR_USER/period-calendar.git
git push -u origin main

# 2. 安装 gh-pages
npm install --save-dev gh-pages

# 3. 在 package.json 添加:
# "homepage": "https://YOUR_USER.github.io/period-calendar"
# "deploy": "gh-pages -d dist"

# 4. 部署
npm run deploy
```

---

### 方案四：任意静态服务器

```bash
# 直接把 dist/ 目录内容上传到任何 Web 服务器
# Nginx 配置示例：
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/period-calendar/dist;
    index index.html;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### 方案五：Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
docker build -t period-calendar .
docker run -p 8080:80 period-calendar
```

---

## 📦 构建产物

| 文件 | 大小 | 说明 |
|------|------|------|
| `dist/index.html` | 0.79 KB | 入口 HTML |
| `dist/assets/index-*.css` | 27.88 KB (gzip 6.11 KB) | 样式文件 |
| `dist/assets/index-*.js` | 242.26 KB (gzip 74.51 KB) | 应用代码 |

> 总 gzip 体积 < 81 KB，首屏加载极快。

---

## 🔗 当前预览地址

已部署在预览环境，可直接访问测试：

**https://webview.e2b.bj7.sandbox.cloudstudio.club/?x-cs-sandbox-id=c91d2f8cc4fe4898a1c4b5f256efceea&x-cs-sandbox-port=8080**

---

## ✅ 部署后检查清单

- [ ] HTTPS 可访问
- [ ] 引导弹窗正常弹出
- [ ] 日历正确显示当月
- [ ] 点击日期可标记经期
- [ ] 经期蓝色标记正确
- [ ] 概率颜色（红/橙）正确
- [ ] 刷新页面数据不丢失
- [ ] 移动端触摸正常
- [ ] Chrome/Safari/Firefox 均可用

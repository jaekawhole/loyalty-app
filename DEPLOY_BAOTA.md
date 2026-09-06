# Everyday Loyalty — 宝塔面板部署手册（给 Cursor 执行）

> 本文档供**服务器上的 Cursor**按步骤部署本项目。  
> 仓库：https://github.com/jaekawhole/loyalty-app  
> 目标：在宝塔（BT Panel）上跑通 Shopify 积分 App 的**后端服务**（HTTPS + MySQL + Node）。

---

## 0. 给 Cursor 的总指令

请严格按本文从 **§1 → §9** 顺序执行。每完成一节，自检通过再进入下一节。  
遇到缺权限、缺软件、域名未解析时，先安装/修复再继续，不要跳过关键步骤。

**部署完成后必须：**

1. 服务 `https://你的域名` 可访问（至少返回 App 页面或 Shopify 相关响应，不是 502）  
2. MySQL 中已有表（Session、ShopSettings 等）  
3. 提醒操作者：在本机/有 Shopify CLI 的环境更新 `shopify.app.toml` 并执行 `shopify app deploy`

---

## 1. 项目是什么（只读理解）

| 项 | 说明 |
|----|------|
| 名称 | Everyday Loyalty（Shopify 积分 / 忠诚计划） |
| 代码目录 | 本仓库根目录（clone 后即项目根） |
| 运行时 | Node.js **≥ 20.19**（推荐 20 LTS） |
| 启动命令 | `npm run build` 后 `npm run start`（或 PM2） |
| 默认端口 | 环境变量 `PORT`，建议 **3000** |
| 数据库 | 生产用 **MySQL**（不要用仓库里的 SQLite） |
| 必须 HTTPS | Shopify 要求公网 HTTPS（OAuth / Webhook / App Proxy） |

**不在服务器上跑的部分：**

- Theme App Extension 由 `shopify app deploy` 推到 Shopify（需 Partner CLI）  
- 店铺后台安装、主题 App embeds 开关在 Shopify Admin 操作  

**服务器只负责：** Node 后端 + MySQL + Nginx HTTPS 反代。

---

## 2. 部署前向操作者确认的信息

Cursor 开始前，向用户确认并记录：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DOMAIN` | 已解析到本机的域名 | `loyalty.example.com` |
| `MYSQL_ROOT_OR_USER` | MySQL 账号 | `loyalty` |
| `MYSQL_PASSWORD` | MySQL 密码 | （用户提供） |
| `MYSQL_DB` | 库名 | `everyday_loyalty` |
| `SHOPIFY_API_SECRET` | Dev Dashboard 的 Client secret（`shpss_...`） | （用户提供，勿写入公开文档） |
| `SHOPIFY_API_KEY` | Client ID | `db0bb2ead14e514358b2f2174b9d65c3`（已知） |

若用户尚未准备域名/HTTPS，先协助在宝塔完成「网站 + 申请 SSL」，再部署应用。

---

## 3. 宝塔环境准备

### 3.1 软件（宝塔「软件商店」）

确保已安装：

- [ ] **Nginx**
- [ ] **MySQL**（5.7+ / 8.0 均可）
- [ ] **PM2 管理器** 或 可用的 Node 版本管理（见下）
- [ ] **Node.js**：**20.x**（不要用 16/18 过旧版本）

命令行验证：

```bash
node -v    # 应 >= v20.19
npm -v
nginx -v
mysql --version
```

### 3.2 创建网站（HTTPS）

1. 宝塔 → 网站 → 添加站点  
2. 域名：`DOMAIN`  
3. 根目录可指向空目录（实际由 Nginx 反代到 Node，不必用 PHP）  
4. SSL → Let’s Encrypt 申请并开启「强制 HTTPS」

### 3.3 创建 MySQL 数据库

宝塔 → 数据库 → 添加：

- 数据库名：`everyday_loyalty`（或用户指定的 `MYSQL_DB`）  
- 用户名 / 密码：记录下来  

测试：

```bash
mysql -u用户名 -p密码 -e "SHOW DATABASES;"
```

---

## 4. 拉取代码

建议目录（可按宝塔习惯调整）：

```bash
mkdir -p /www/wwwroot/loyalty-app
cd /www/wwwroot/loyalty-app
```

若目录为空：

```bash
git clone https://github.com/jaekawhole/loyalty-app.git .
```

若已有空站点目录，也可 clone 到子目录后把 Nginx 指到反代即可。

```bash
git status
node -v
```

---

## 5. 改成 MySQL（必须）

仓库默认是 SQLite，生产必须改 MySQL。

### 5.1 修改 `prisma/schema.prisma`

将：

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:dev.sqlite"
}
```

改为：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 5.2 处理迁移

SQLite 的 `prisma/migrations` **不能直接**用在 MySQL 上。任选其一：

**推荐 A（干净）：**

```bash
# 备份后重置迁移（仅新库、无生产数据时）
rm -rf prisma/migrations
npx prisma migrate dev --name init_mysql --create-only
# 检查生成的 SQL 无误后：
npx prisma migrate deploy
```

若 `migrate dev` 在无交互环境失败，可用：

```bash
npx prisma db push
npx prisma generate
```

（`db push` 适合先跑通；稳定后应补规范 migration。）

**注意：** 修改 schema 后执行 `npx prisma generate`。

---

## 6. 配置环境变量

在项目根创建 **`.env`**（不要提交 Git）：

```bash
cat > /www/wwwroot/loyalty-app/.env << 'EOF'
NODE_ENV=production
PORT=3000

SHOPIFY_API_KEY=db0bb2ead14e514358b2f2174b9d65c3
SHOPIFY_API_SECRET=请替换为真实_shpss密钥
SHOPIFY_APP_URL=https://你的域名

SCOPES=read_orders,write_discounts,read_discounts,read_customers,write_customers

DATABASE_URL=mysql://用户名:密码@127.0.0.1:3306/everyday_loyalty
EOF
```

把其中的密钥、域名、数据库账号换成真实值。  
若密码含特殊字符，需对 `DATABASE_URL` 做 URL 编码。

权限：

```bash
chmod 600 .env
```

---

## 7. 安装依赖、构建、启动

```bash
cd /www/wwwroot/loyalty-app
npm ci
npx prisma generate
npx prisma migrate deploy   # 或上一节的 db push
npm run build
```

### 用 PM2 常驻（推荐）

```bash
npm i -g pm2
pm2 delete everyday-loyalty 2>/dev/null || true
pm2 start npm --name everyday-loyalty -- start
pm2 save
pm2 startup
pm2 status
pm2 logs everyday-loyalty --lines 50
```

本地探测：

```bash
curl -I http://127.0.0.1:3000
```

应有 HTTP 响应（非 connection refused）。

---

## 8. Nginx 反代（宝塔）

### 8.1 配置思路

站点 `DOMAIN` 的 Nginx 配置中，**反代到** `http://127.0.0.1:3000`，并保留 SSL。

在宝塔该站点 → 设置 → 配置文件，确保类似：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name 你的域名;

    # SSL 证书由宝塔管理的部分保留

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
    }
}
```

保存后重载 Nginx：

```bash
nginx -t && nginx -s reload
```

### 8.2 验证

```bash
curl -I https://你的域名
```

应返回 200/302 等，**不要** 502。若 502：查 `pm2 logs`、防火墙、是否监听 3000。

---

## 9. Shopify 侧配置（Cursor 提醒用户 / 有 CLI 则执行）

服务器部署完成后，`SHOPIFY_APP_URL` 已是正式域名，还需要更新 Shopify App 配置。

### 9.1 修改 `shopify.app.toml`

```toml
application_url = "https://你的域名"

[auth]
redirect_urls = [
  "https://你的域名/auth/callback",
  "https://你的域名/auth/shopify/callback",
  "https://你的域名/api/auth/callback"
]
```

### 9.2 发布配置到 Shopify

在**已登录 Shopify Partner / 已装 Shopify CLI** 的环境执行：

```bash
cd /www/wwwroot/loyalty-app   # 或本机 clone 同仓库
shopify app deploy --client-id db0bb2ead14e514358b2f2174b9d65c3 --allow-updates
```

无 CLI 时：到 [Dev Dashboard](https://dev.shopify.com/dashboard) → Everyday Loyalty → 手动把 App URL / 回调 URL 改成同一域名。

### 9.3 店铺侧检查清单（人工）

- [ ] gomenin 店铺已安装 Everyday Loyalty；改 URL 后如提示则重新授权  
- [ ] 主题（如 Symmetry2024）→ 自定义 → **App embeds** → 启用 **Everyday Loyalty launcher**  
- [ ] 后台能打开 App（默认简体中文）  
- [ ] 已下过单的登录客户前台可见法语浮窗  

### 9.4 订单自动积分（可选，常需额外审批）

`shopify.app.toml` 中 `orders/paid`、`refunds/create` 默认注释。  
需在 Dev Dashboard 申请 **Protected Customer Data** 通过后，取消注释再 `shopify app deploy`。  
未开通前只能后台手动加减分。

---

## 10. 常用运维命令

```bash
pm2 restart everyday-loyalty
pm2 logs everyday-loyalty
cd /www/wwwroot/loyalty-app && git pull && npm ci && npm run build && pm2 restart everyday-loyalty
```

更新代码后若改了 Prisma schema，先跑迁移再重启。

---

## 11. 故障排查

| 现象 | 排查 |
|------|------|
| 502 | `pm2 status`、`curl 127.0.0.1:3000`、Nginx 反代端口 |
| OAuth / 安装失败 | `SHOPIFY_APP_URL`、toml 回调、SSL 是否与域名一致 |
| 数据库错误 | `DATABASE_URL`、用户权限、是否已 `prisma generate` / migrate |
| 前台无浮窗 | 主题 App embeds、客户是否登录且有过积分入账 |
| Webhook 不入账 | PCD 权限、toml 是否启用 orders/paid、App URL 是否可达 |

---

## 12. 安全注意

- [ ] `.env` 权限 `600`，勿提交 Git、勿贴到公开聊天  
- [ ] 仅开放 80/443；3000 不要对公网暴露  
- [ ] `SHOPIFY_API_SECRET` 只放服务器环境变量  

---

## 13. Cursor 完成后的回复模板

向用户汇报：

1. 代码路径、PM2 进程名、监听端口  
2. 域名 `https://...` 是否可访问  
3. MySQL 库名、是否已建表  
4. `.env` 已配置项（**不要回显 secret 明文**）  
5. 待用户在 Shopify CLI / Dashboard 完成的事项（§9）  
6. 未解决的问题与日志摘要  

---

## 附录 A — 已知常量

```text
GitHub:        https://github.com/jaekawhole/loyalty-app.git
Client ID:     db0bb2ead14e514358b2f2174b9d65c3
Scopes:        read_orders,write_discounts,read_discounts,read_customers,write_customers
App Proxy:     /apps/loyalty  → 应用内 /proxy
默认积分规则:  €1 = 1 分；100 分 = €5
前台语言:      fr（法语）
后台语言:      zh-CN（简体中文，可在 App 设置改）
```

## 附录 B — 目录结构（关键）

```text
loyalty-app/
  app/                 # 后台与 API（React Router）
  extensions/          # 主题浮窗扩展
  prisma/              # 数据库 schema / migrations
  shopify.app.toml     # Shopify App 配置（部署后改域名）
  Dockerfile
  package.json
  DEPLOY_BAOTA.md      # 本文件
```

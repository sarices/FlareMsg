# 部署指南

本文档介绍如何将 FlareMsg 部署到 Cloudflare Workers。

## 📋 前置要求

1. **Cloudflare 账户**
   - 注册地址：https://dash.cloudflare.com/

2. **微信公众号配置**
   - 微信公众号 AppID
   - 微信公众号 AppSecret
   - 微信模版消息 ID

3. **GitHub 仓库**（用于自动部署）

## 🚀 部署方式

### 方式一：通过 GitHub Actions 自动部署（推荐）

#### 步骤 1：创建 Cloudflare KV Namespace

```bash
# 创建生产环境 KV Namespace
npx wrangler kv:namespace create WECHAT_KV

# 记录返回的 id，例如：
# { id: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

#### 步骤 2：获取 Cloudflare API 凭证

1. **获取 Account ID**
   - 访问：https://dash.cloudflare.com/
   - 在右侧 Workers 页面可以找到 Account ID

2. **创建 API Token**
   - 访问：https://dash.cloudflare.com/profile/api-tokens
   - 点击 "Create Token"
   - 选择 "Edit Cloudflare Workers" 模板
   - 权限配置：
     - Account - Cloudflare Workers: Edit
     - Zone - Zone: Read（如果需要绑定域名）
   - 点击 "Continue to summary" → "Create Token"
   - **重要**：复制生成的 Token（只显示一次）

#### 步骤 3：配置 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets（Settings → Secrets and variables → Actions → New repository secret）：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `CLOUDFLARE_API_TOKEN` | 上一步创建的 API Token | Cloudflare API 令牌 |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID | 账户 ID |
| `KV_NAMESPACE_ID` | 生产环境 KV Namespace ID | 步骤 1 创建的 ID |
| `WECHAT_APP_ID` | 微信公众号 AppID | 从微信公众平台获取 |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | 从微信公众平台获取 |
| `CLIENT_AUTH_TOKEN` | 自定义鉴权密钥 | 用于 API 调用和管理页面 |

#### 步骤 4：推送代码触发部署

```bash
git add .
git commit -m "部署到 Cloudflare Workers"
git push origin main
```

推送后，GitHub Actions 会自动：
1. 运行类型检查
2. 配置 wrangler.toml
3. 部署到 Cloudflare Workers
4. 设置环境变量

#### 步骤 5：验证部署

访问：`https://flaremsg.YOUR_SUBDOMAIN.workers.dev/`

---

### 方式二：手动部署

#### 步骤 1：登录 Cloudflare

```bash
npx wrangler login
```

#### 步骤 2：创建 KV Namespace

```bash
# 生产环境
npx wrangler kv:namespace create WECHAT_KV

# 本地开发环境
npx wrangler kv:namespace create WECHAT_KV --preview
```

#### 步骤 3：配置 wrangler.toml

编辑 `src/wrangler.toml`，替换以下内容：

```toml
[[kv_namespaces]]
binding = "WECHAT_KV"
id = "YOUR_KV_NAMESPACE_ID"  # 替换为步骤 2 返回的 id
preview_id = "YOUR_PREVIEW_ID"  # 替换为 --preview 返回的 id
```

#### 步骤 4：设置环境变量

```bash
# 微信配置
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET

# API 鉴权
npx wrangler secret put CLIENT_AUTH_TOKEN
```

#### 步骤 5：部署

```bash
cd src
npx wrangler deploy
```

---

## 🔧 部署后配置

### 1. 获取 Worker URL

部署成功后会显示：
```
Published flaremsg (X.XX sec)
  https://flaremsg.YOUR_SUBDOMAIN.workers.dev
```

### 2. 测试 API

```bash
# 测试首页
curl https://flaremsg.YOUR_SUBDOMAIN.workers.dev/

# 测试消息发送（使用全局 Token）
curl -X POST https://flaremsg.YOUR_SUBDOMAIN.workers.dev/send \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_CLIENT_AUTH_TOKEN",
    "openid": "USER_OPENID",
    "desc": "测试消息"
  }'
```

### 3. 添加用户 Token

访问管理页面：`https://flaremsg.YOUR_SUBDOMAIN.workers.dev/admin`

输入 `CLIENT_AUTH_TOKEN` 登录，然后可以添加、查看、删除用户 Token。

---

## 📊 管理用户 Token

### 通过 Web 界面（推荐）

1. 访问 `/admin` 页面
2. 输入管理员 Token (`CLIENT_AUTH_TOKEN`)
3. 添加、查看、删除用户 Token

### 通过 API

```bash
# 列出所有 Token
curl -H "Authorization: Bearer CLIENT_AUTH_TOKEN" \
  https://flaremsg.YOUR_SUBDOMAIN.workers.dev/admin/api/tokens

# 添加新 Token（自动生成）
curl -X POST \
  https://flaremsg.YOUR_SUBDOMAIN.workers.dev/admin/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CLIENT_AUTH_TOKEN" \
  -d '{"openid": "USER_OPENID"}'

# 删除 Token
curl -X DELETE \
  "https://flaremsg.YOUR_SUBDOMAIN.workers.dev/admin/api/tokens?key=sk_xxx" \
  -H "Authorization: Bearer CLIENT_AUTH_TOKEN"
```

### 通过命令行

```bash
# 添加 Token
npx wrangler kv key put "sk_user_token" "USER_OPENID" \
  --binding=WECHAT_KV

# 查看所有 Token
npx wrangler kv key list --binding=WECHAT_KV --prefix="sk_"
```

---

## 🌐 绑定自定义域名（可选）

### 步骤 1：添加域名

在 Cloudflare Dashboard：
1. 进入 Workers → flaremsg → Triggers
2. 点击 "Add Custom Domain"
3. 输入域名，例如：`msg.yourdomain.com`

### 步骤 2：配置 DNS

如果你的域名也在 Cloudflare：
- 系统会自动配置 DNS 记录

如果域名在其他服务商：
- 添加 CNAME 记录指向 `flaremsg.YOUR_SUBDOMAIN.workers.dev`

---

## 🔒 安全建议

1. **保护 CLIENT_AUTH_TOKEN**
   - 不要在代码中硬编码
   - 定期更换
   - 使用强随机字符串

2. **使用 HTTPS**
   - 所有 API 调用都应使用 HTTPS
   - Cloudflare Workers 自动提供 SSL

3. **限制访问**
   - 为不同的用户/应用创建独立的 Token
   - 定期审计 Token 使用情况

4. **监控使用量**
   - 在 Cloudflare Dashboard 查看 Analytics
   - 设置使用量告警

---

## 🐛 故障排查

### 部署失败

1. **检查 GitHub Secrets**
   ```bash
   # 本地测试配置
   npx wrangler whoami
   npx wrangler kv:namespace list
   ```

2. **查看日志**
   - GitHub Actions → 选择失败的 workflow → 查看详细日志

### API 调用失败

1. **Token 验证失败**
   - 检查 `CLIENT_AUTH_TOKEN` 是否正确
   - 确认使用的是生产环境的 Token

2. **微信 API 错误**
   - 检查 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
   - 确认模版 ID 正确
   - 查看微信返回的错误码

3. **KV 读取失败**
   - 确认 KV Namespace 已创建
   - 检查 `wrangler.toml` 配置

---

## 📝 更新部署

每次代码更新后：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

GitHub Actions 会自动部署新版本。

---

## 🎯 生产环境检查清单

部署前确认：

- [ ] 已创建生产环境 KV Namespace
- [ ] 已配置所有 GitHub Secrets
- [ ] `wrangler.toml` 中的 `id` 已替换为生产环境 ID
- [ ] 微信配置正确（AppID、AppSecret、模版 ID）
- [ ] 类型检查通过：`npm run type-check`
- [ ] 本地测试成功
- [ ] 已设置自定义域名（可选）

---

## 📚 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [微信模版消息 API](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html)

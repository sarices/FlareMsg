# GitHub Secrets 配置指南

在 GitHub Actions 部署到 Cloudflare Workers 之前，你需要在 GitHub 仓库的 Secrets 中配置以下环境变量。

## 必需的 Secrets

### 1. Cloudflare 配置

#### CLOUDFLARE_API_TOKEN
Cloudflare API Token，用于部署 Workers。

**获取方法：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "My Profile" → "API Tokens"
3. 点击 "Create Token"
4. 选择 "Edit Cloudflare Workers" 模板
5. 权限设置：
   - Account → Cloudflare Workers → Edit
   - Account → Account Settings → Read
6. 创建后复制 token

#### CLOUDFLARE_ACCOUNT_ID
你的 Cloudflare Account ID。

**获取方法：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的站点
3. 在右侧边栏或 URL 中找到 Account ID
4. 格式类似：`23ac0af2ff87d3b2b78afc4d9147f6ca`

#### KV_NAMESPACE_ID
Cloudflare KV Namespace 的 ID。

**获取方法：**

**选项 1: 使用现有的 KV Namespace**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages"
3. 选择 "KV" → "Create a namespace"
4. 或查看现有 namespace 的 ID
5. 复制 namespace ID（格式类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

**选项 2: 创建新的 KV Namespace**
```bash
# 使用 Wrangler CLI 创建
wrangler kv:namespace create WECHAT_KV

# 输出示例：
# ⛅️ wrangler 4.59.2
# ───────────────────────────────────────
# 🌀 Creating namespace with title "flaremsg-WECHAT_KV"
# ✨ Success!
# Add the following to your configuration file in your KV namespace binding:
# [[kv_namespaces]]
# binding = "WECHAT_KV"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#
# If you want to use this namespace for preview environments, create a preview namespace with:
# wrangler kv:namespace create WECHAT_KV --preview
```

复制输出的 `id` 值（例如：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 2. 微信公众号配置

#### WECHAT_APP_ID
微信公众号的 AppID。

**获取方法：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 "开发" → "基本配置"
3. 复制 "开发者ID(AppID)"

#### WECHAT_APP_SECRET
微信公众号的 AppSecret。

**获取方法：**
1. 在微信公众平台 "基本配置" 页面
2. 点击 "重置" 或 "查看" AppSecret
3. 复制密钥（**重要：只会显示一次，请妥善保存**）

### 3. 应用配置

#### CLIENT_AUTH_TOKEN
自定义的 API 鉴权密钥，用于保护你的推送接口。

**生成方法：**
```bash
# 使用随机字符串生成
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 示例输出：a1b2c3d4e5f6...
```

请保存生成的 token，调用 API 时需要使用。

## 在 GitHub 中添加 Secrets

1. 进入你的 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 为每个密钥添加：
   - **Name**: 密钥名称（例如：`CLOUDFLARE_API_TOKEN`）
   - **Secret**: 密钥值
5. 点击 "Add secret"

重复以上步骤，添加所有 6 个必需的 Secrets：

```
✅ CLOUDFLARE_API_TOKEN
✅ CLOUDFLARE_ACCOUNT_ID
✅ KV_NAMESPACE_ID
✅ WECHAT_APP_ID
✅ WECHAT_APP_SECRET
✅ CLIENT_AUTH_TOKEN
```

## 验证配置

配置完成后，推送代码到 `main` 分支会自动触发部署。你可以在 GitHub Actions 页面查看部署日志：

1. 进入仓库的 "Actions" 标签页
2. 选择最新的 workflow run
3. 查看 "Configure wrangler.toml" 步骤
4. 应该看到：`✅ Configured KV Namespace ID: [你的ID]`

## 常见问题

### Q: 部署失败，提示 "KV_NAMESPACE_ID secret is not set"
**A:** 请确保在 GitHub Secrets 中添加了 `KV_NAMESPACE_ID`，且名称完全一致（区分大小写）。

### Q: sed 替换失败，ID 还是占位符
**A:** 检查 KV Namespace ID 是否正确配置在 GitHub Secrets 中，不要包含引号或额外空格。

### Q: 如何测试本地开发环境？
**A:** 本地开发会使用 `wrangler.toml` 中的 `preview_id`，不需要配置 GitHub Secrets。

```bash
cd src
wrangler dev
```

## 安全提醒

- ❌ **不要**将敏感信息提交到 Git 仓库
- ❌ **不要**在代码中硬编码 API Token 或密钥
- ✅ **始终**使用 GitHub Secrets 或环境变量
- ✅ **定期轮换** API Token 和密钥

## 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [项目部署指南](./DEPLOY.md)

# GitHub 自动部署配置指南

本文档说明如何配置 FlareMsg 项目的 GitHub 自动部署到 Cloudflare Workers。

## 方法一：GitHub Actions（推荐）

已配置工作流文件：`src/.github/workflows/deploy.yml`

### 需要设置的 GitHub Secrets：

1. **CLOUDFLARE_API_TOKEN**
   - 前往 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - 创建新 Token，选择 **Edit Cloudflare Workers** 模板
   - 或手动配置权限：
     - Workers: Workers Scripts: Edit
     - Workers: Workers Routes: Edit
     - Workers KV Storage: Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - 在 Cloudflare Dashboard 右上角 → 点击你的头像 → **My Profile**
   - 在左侧菜单选择 **API Tokens**
   - 在 **API Tokens** 页面找到 **Account ID**

### 在 GitHub 仓库设置 Secrets：

1. 前往你的 GitHub 仓库
2. Settings → Secrets and variables → Actions → New repository secret
3. 添加上述两个 Secrets

### 工作流触发条件：

- 推送代码到 `main` 分支
- 创建 Pull Request 到 `main` 分支
- 手动在 Actions 页面触发

## 方法二：Cloudflare Dashboard 集成

更简单但控制较少：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → 选择你的 Worker（flaremsg）
3. 选择 **Settings** → **Triggers** → **GitHub**
4. 连接你的 GitHub 账户和仓库
5. 选择分支和部署策略

## 注意事项

### 1. 微信相关 Secrets

微信的敏感信息（`WECHAT_APP_ID`, `WECHAT_APP_SECRET`, `CLIENT_AUTH_TOKEN`）**不会**通过 GitHub Actions 设置，需要在 Cloudflare Dashboard 中设置：

```bash
# 本地设置（一次性）
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put CLIENT_AUTH_TOKEN
```

或通过 Cloudflare Dashboard：

- Workers & Pages → 选择 flaremsg → Settings → Variables

### 2. KV Namespace

KV Namespace 已在 `wrangler.toml` 中配置，会自动创建/复用。

### 3. 环境变量

非敏感环境变量（如 `WECHAT_TEMPLATE_ID`, `DEFAULT_FROM` 等）已在 `wrangler.toml` 中配置。

## 故障排除

### 部署失败可能原因：

1. **缺少 API Token 或 Account ID**：检查 GitHub Secrets 设置
2. **权限不足**：确保 API Token 有 Workers 编辑权限
3. **TypeScript 错误**：本地运行 `npm run type-check` 修复类型错误
4. **wrangler.toml 配置错误**：检查 KV Namespace ID 等配置

### 测试部署：

```bash
# 本地测试
npm run type-check
npx wrangler deploy --dry-run
```

## 项目结构说明

- GitHub Actions 工作流配置在 `.github/workflows/` 目录中

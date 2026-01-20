# 配置说明

## 本地开发配置

### 方法 1：使用 .env 文件（推荐）

1. 复制配置模板：
```bash
cp wrangler.toml.example wrangler.toml
cp .dev.vars.example .dev.vars
```

2. 填写 `wrangler.toml` 中的配置：
- `YOUR_KV_NAMESPACE_ID`: 你的 KV Namespace ID
- `YOUR_TEMPLATE_ID`: 你的微信模板 ID

3. 填写 `.dev.vars` 中的敏感信息（不会被提交到 Git）：
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `CLIENT_AUTH_TOKEN`

### 方法 2：直接修改 wrangler.toml

本地开发时，可以直接修改 `wrangler.toml` 填入实际配置，但**不要提交**修改后的文件。

## GitHub Actions 配置（CI/CD）

需要在 GitHub 仓库的 Secrets 中配置以下变量：

### Cloudflare 配置
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `KV_NAMESPACE_ID`: KV Namespace ID（从 `wrangler kv:namespace create` 获取）
- `WECHAT_TEMPLATE_ID`: 微信模板 ID

### 微信公众号配置（通过 wrangler secret）
```bash
# 本地设置
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put CLIENT_AUTH_TOKEN
```

或通过 Cloudflare Dashboard：
- Workers & Pages → flaremsg → Settings → Variables → Secrets and env vars

## 配置优先级

1. 本地开发：使用 `wrangler.toml` 和 `.dev.vars`
2. CI/CD：使用 GitHub Secrets 动态替换配置
3. 生产环境：通过 wrangler secret 设置敏感信息

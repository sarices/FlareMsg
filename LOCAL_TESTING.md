# 本地测试指南

本文档说明如何在本地环境测试 FlareMsg 服务。

## 前置准备

### 1. 安装依赖

```bash
npm install
```

### 2. 获取微信测试号信息

访问 [微信公众平台测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)：

1. 记录 **appID** 和 **appSecret**
2. 新增模版消息，记录 **template_id**
3. 关注测试号，获取个人 **openid**

## 配置本地环境

### 方式 1: 使用 .dev.vars 文件（推荐）

创建 `.dev.vars` 文件（此文件会被 .gitignore 忽略）：

```bash
# 在 src 目录下创建 .dev.vars
cat > .dev.vars << 'EOF'
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
CLIENT_AUTH_TOKEN=你的自定义鉴权密钥
EOF
```

**注意**: `.dev.vars` 文件格式为 `KEY=VALUE`，每行一个变量，不需要引号。

### 方式 2: 使用 wrangler.toml（不推荐）

直接在 `wrangler.toml` 中填入真实值（**不要提交到 Git**）：

```toml
[vars]
WECHAT_TEMPLATE_ID = "你的真实模版ID"
# ... 其他配置
```

## 启动本地开发服务器

### 基本启动

```bash
npm run dev
```

或者：

```bash
wrangler dev
```

启动成功后，你会看到类似输出：

```
⛅️ wrangler 3.x.x
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### 指定端口

```bash
wrangler dev --port 3000
```

### 启用远程模式（使用真实 KV）

```bash
wrangler dev --remote
```

**注意**: 远程模式会使用 Cloudflare 上的真实 KV Namespace，需要先创建 KV。

## 本地测试方法

### 方法 1: 使用 cURL

#### 基础测试（使用默认内容）

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "token": "你的CLIENT_AUTH_TOKEN",
    "openid": "你的微信openid",
    "desc": "本地测试消息"
  }'
```

#### 完整参数测试

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "token": "你的CLIENT_AUTH_TOKEN",
    "openid": "你的微信openid",
    "from": "本地测试",
    "desc": "这是一条本地测试消息",
    "remark": "测试时间: 2024-01-19 16:00",
    "url": "https://github.com"
  }'
```

#### 使用 Header 鉴权

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的CLIENT_AUTH_TOKEN" \
  -d '{
    "openid": "你的微信openid",
    "desc": "使用 Header 鉴权的测试"
  }'
```

### 方法 2: 使用 HTTPie（更友好的输出）

安装 HTTPie:

```bash
brew install httpie  # macOS
# 或
pip install httpie
```

测试请求:

```bash
http POST http://localhost:8787 \
  token="你的CLIENT_AUTH_TOKEN" \
  openid="你的微信openid" \
  desc="HTTPie 测试消息"
```

### 方法 3: 使用 Postman 或 Insomnia

1. 创建新的 POST 请求
2. URL: `http://localhost:8787`
3. Headers: `Content-Type: application/json`
4. Body (JSON):

```json
{
  "token": "你的CLIENT_AUTH_TOKEN",
  "openid": "你的微信openid",
  "desc": "Postman 测试消息"
}
```

### 方法 4: 使用测试脚本

运行自动化测试脚本：

```bash
./test-local.sh
```

脚本会提示你输入：

```
=== FlareMsg 本地测试 ===

请输入测试配置:
CLIENT_AUTH_TOKEN (鉴权密钥): test123456
WECHAT_OPENID (微信 OpenID): oABCD1234567890
服务地址 (默认: http://localhost:8787): [直接回车使用默认值]

配置完成，开始测试...
```

脚本会自动执行 6 个测试用例：

1. 基础发送（仅必填参数）
2. 完整参数发送
3. Header 鉴权
4. 鉴权失败测试（预期 401）
5. 缺少参数测试（预期 400）
6. 错误方法测试（预期 405）

## 查看日志和调试

### 查看实时日志

Wrangler dev 会自动显示请求日志：

```
[wrangler:inf] GET / 200 OK (25ms)
[wrangler:inf] POST / 200 OK (156ms)
```

### 添加调试日志

在 `index.ts` 中添加 `console.log`:

```typescript
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    console.log("收到请求:", request.method, request.url);

    const body = (await request.json()) as RequestBody;
    console.log("请求体:", JSON.stringify(body, null, 2));

    // ... 其他代码
  },
};
```

### 使用 wrangler tail（查看远程日志）

如果使用 `--remote` 模式：

```bash
# 在另一个终端窗口
wrangler tail
```

## 常见问题排查

### 1. KV Namespace 未找到

**错误信息**:

```
KV Namespace binding "WECHAT_KV" not found
```

**解决方案**:

- 本地开发时，KV 会自动模拟，不需要真实的 KV
- 如果使用 `--remote` 模式，需要先创建 KV:
  ```bash
  wrangler kv:namespace create WECHAT_KV
  ```

### 2. 环境变量未加载

**错误信息**:

```
env.WECHAT_APP_ID is undefined
```

**解决方案**:

- 检查 `.dev.vars` 文件是否存在且格式正确
- 确保 `.dev.vars` 在 `src/` 目录下
- 重启 `wrangler dev`

### 3. 微信 API 调用失败

**错误信息**:

```
Failed to get access token: invalid appid
```

**解决方案**:

- 检查 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是否正确
- 确认微信测试号是否有效
- 检查网络连接

### 4. Token 缓存问题

如果想清除本地 KV 缓存：

```bash
# 停止 wrangler dev
# 删除本地缓存目录
rm -rf .wrangler/state

# 重新启动
npm run dev
```

### 5. 端口被占用

**错误信息**:

```
Error: listen EADDRINUSE: address already in use :::8787
```

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :8787

# 杀死进程
kill -9 <PID>

# 或使用其他端口
wrangler dev --port 3000
```

## 测试检查清单

在部署到生产环境前，确保完成以下测试：

- [ ] **基础发送**: 仅传 token 和 openid，验证默认内容
- [ ] **完整发送**: 传入所有参数，验证内容覆盖和跳转
- [ ] **鉴权测试**: 使用错误 token，验证返回 401
- [ ] **参数验证**: 缺少 openid，验证返回 400
- [ ] **Token 缓存**: 多次请求，验证 token 从缓存读取
- [ ] **错误处理**: 使用无效的 openid，验证错误信息

## 性能测试

### 使用 Apache Bench

```bash
# 安装 ab (macOS 自带)
# 测试 100 个请求，并发 10
ab -n 100 -c 10 -p payload.json -T application/json http://localhost:8787/
```

`payload.json`:

```json
{
  "token": "你的CLIENT_AUTH_TOKEN",
  "openid": "你的微信openid",
  "desc": "性能测试"
}
```

### 使用 wrk

```bash
# 安装 wrk
brew install wrk

# 测试 30 秒，2 个线程，10 个连接
wrk -t2 -c10 -d30s -s post.lua http://localhost:8787/
```

`post.lua`:

```lua
wrk.method = "POST"
wrk.body   = '{"token":"你的TOKEN","openid":"你的OPENID","desc":"wrk测试"}'
wrk.headers["Content-Type"] = "application/json"
```

## 下一步

测试通过后，可以：

1. **部署到 Cloudflare**:

   ```bash
   wrangler deploy
   ```

2. **查看生产日志**:

   ```bash
   wrangler tail
   ```

3. **监控和调试**:
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 查看 Workers 分析和日志

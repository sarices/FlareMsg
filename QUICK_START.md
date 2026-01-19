# 快速开始指南

本文档提供最快速的本地测试步骤。

## 5 分钟快速测试

### 1. 安装依赖（1 分钟）

```bash
npm install
```

### 2. 配置环境变量（2 分钟）

复制示例文件并填入真实值：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入你的微信测试号信息：

```bash
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
CLIENT_AUTH_TOKEN=test123456
```

**获取微信测试号信息**：访问 https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login

### 3. 配置模版 ID（1 分钟）

编辑 `wrangler.toml`，将 `YOUR_TEMPLATE_ID` 替换为你的微信模版 ID：

```toml
WECHAT_TEMPLATE_ID = "你的模版ID"
```

### 4. 启动开发服务器（10 秒）

```bash
npm run dev
```

看到以下输出表示启动成功：

```
⛅️ wrangler 3.x.x
Ready on http://localhost:8787
```

### 5. 发送测试消息（30 秒）

打开新终端，发送测试请求：

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test123456",
    "openid": "你的微信openid",
    "desc": "测试消息"
  }'
```

**成功响应**：

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "msgid": 123456789
}
```

检查你的微信，应该收到测试消息！

## 使用测试脚本

运行测试脚本，按提示输入配置：

```bash
./test-local.sh
```

脚本会提示你输入：
- **CLIENT_AUTH_TOKEN**: 你在 `.dev.vars` 中设置的鉴权密钥
- **WECHAT_OPENID**: 你的微信 openid
- **服务地址**: 默认 `http://localhost:8787`，直接回车使用默认值

测试脚本会自动执行 6 个测试用例并显示结果。

## 常见问题

### Q: 如何获取 openid？

A: 关注微信测试号后，在测试号页面的"用户列表"中可以看到你的 openid。

### Q: 如何创建模版消息？

A: 在测试号页面点击"新增测试模版"，模版内容：

```
{{FROM.DATA}}
{{DESC.DATA}}
{{REMARK.DATA}}
```

### Q: 端口被占用怎么办？

A: 使用其他端口：

```bash
wrangler dev --port 3000
```

### Q: 看不到日志怎么办？

A: 在代码中添加 `console.log`，wrangler dev 会自动显示。

## 下一步

- 查看 [LOCAL_TESTING.md](./LOCAL_TESTING.md) 了解详细测试方法
- 查看 [README.md](../README.md) 了解完整功能
- 准备部署：`wrangler deploy`

## 需要帮助？

- 查看 [CLAUDE.md](../CLAUDE.md) 了解项目架构
- 查看 [.agentdocs/index.md](../.agentdocs/index.md) 了解技术细节

/**
 * FlareMsg - Cloudflare Workers 微信消息推送服务
 *
 * 主要功能：
 * 1. 接收 HTTP POST 请求
 * 2. 自动管理微信 Access Token（KV 缓存 + 自动刷新）
 * 3. 发送微信模版消息
 */

// 环境变量类型定义
interface Env {
  // KV Namespace (动态 binding)
  [key: string]: any;  // 支持动态访问 KV binding

  // Secrets
  WECHAT_APP_ID: string;
  WECHAT_APP_SECRET: string;
  CLIENT_AUTH_TOKEN: string;

  // 配置变量
  WECHAT_TEMPLATE_ID: string;
  KV_BINDING_NAME?: string;  // KV Namespace 的 binding 名称（默认: "WECHAT_KV"）
  DEFAULT_FROM?: string;
  DEFAULT_DESC?: string;
  DEFAULT_REMARK?: string;
  DEFAULT_URL?: string;
  COLOR_FROM?: string;
  COLOR_DESC?: string;
  COLOR_REMARK?: string;
}

// 请求体类型定义
interface RequestBody {
  token?: string;
  openid: string;
  from?: string;
  desc?: string;
  remark?: string;
  url?: string;
}

// 消息 Payload 类型定义
interface MessagePayload {
  openid: string;
  from?: string;
  desc?: string;
  remark?: string;
  url?: string;
}

// 微信 API 响应类型
interface WechatApiResponse {
  errcode: number;
  errmsg: string;
  msgid?: number;
  access_token?: string;
}

// 微信模版消息 Payload 类型
interface WechatTemplatePayload {
  touser: string;
  template_id: string;
  url: string;
  data: {
    FROM: { value: string; color: string };
    DESC: { value: string; color: string };
    REMARK: { value: string; color: string };
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 只接受 POST 请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        errcode: -1,
        errmsg: 'Only POST method is allowed'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // 解析请求体
      const body = await request.json() as RequestBody;

      // 鉴权：检查 token（支持 body 或 header）
      const clientToken = body.token || request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!clientToken || clientToken !== env.CLIENT_AUTH_TOKEN) {
        return new Response(JSON.stringify({
          errcode: -1,
          errmsg: 'Unauthorized: Invalid token'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 验证必填参数
      if (!body.openid) {
        return new Response(JSON.stringify({
          errcode: -1,
          errmsg: 'Missing required parameter: openid'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 调用发送消息函数
      const result = await sendWechatMessage(env, {
        openid: body.openid,
        from: body.from,
        desc: body.desc,
        remark: body.remark,
        url: body.url
      });

      return new Response(JSON.stringify(result), {
        status: result.errcode === 0 ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({
        errcode: -1,
        errmsg: `Server error: ${errorMessage}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 获取 KV Namespace 实例
 * @param env - 环境变量
 * @returns KV Namespace 实例
 */
function getKV(env: Env): KVNamespace {
  const bindingName = env.KV_BINDING_NAME || 'WECHAT_KV';
  const kv = env[bindingName] as KVNamespace;

  if (!kv) {
    throw new Error(`KV Namespace binding "${bindingName}" not found. Please check your wrangler.toml configuration.`);
  }

  return kv;
}

/**
 * 获取微信 Access Token
 * @param env - 环境变量
 * @param forceRefresh - 是否强制刷新
 * @returns Access Token
 */
async function getAccessToken(env: Env, forceRefresh: boolean = false): Promise<string> {
  const kv = getKV(env);
  const KV_KEY = 'access_token';

  // 如果不强制刷新，先尝试从 KV 读取
  if (!forceRefresh) {
    const cachedToken = await kv.get(KV_KEY);
    if (cachedToken) {
      return cachedToken;
    }
  }

  // 请求新的 Access Token
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WECHAT_APP_ID}&secret=${env.WECHAT_APP_SECRET}`;

  const response = await fetch(tokenUrl);
  const data = await response.json() as WechatApiResponse;

  if (data.access_token) {
    // 存入 KV，TTL 设置为 7000 秒（略低于微信官方的 7200 秒）
    await kv.put(KV_KEY, data.access_token, {
      expirationTtl: 7000
    });
    return data.access_token;
  } else {
    throw new Error(`Failed to get access token: ${data.errmsg || 'Unknown error'}`);
  }
}

/**
 * 发送微信模版消息
 * @param env - 环境变量
 * @param payload - 消息内容 {openid, from, desc, remark, url}
 * @param isRetry - 是否为重试请求
 * @returns 微信 API 响应
 */
async function sendWechatMessage(
  env: Env,
  payload: MessagePayload,
  isRetry: boolean = false
): Promise<WechatApiResponse> {
  // 获取 Access Token
  const accessToken = await getAccessToken(env, false);

  // 应用三级优先级：请求参数 > 环境变量 > 默认值
  const from = payload.from || env.DEFAULT_FROM || '系统通知';
  const desc = payload.desc || env.DEFAULT_DESC || '无内容';
  const remark = payload.remark || env.DEFAULT_REMARK || '';
  const url = payload.url || env.DEFAULT_URL || '';

  // 构造微信模版消息 payload
  const wechatPayload: WechatTemplatePayload = {
    touser: payload.openid,
    template_id: env.WECHAT_TEMPLATE_ID,
    url: url,
    data: {
      FROM: {
        value: from,
        color: env.COLOR_FROM || '#173177'
      },
      DESC: {
        value: desc,
        color: env.COLOR_DESC || '#000000'
      },
      REMARK: {
        value: remark,
        color: env.COLOR_REMARK || '#888888'
      }
    }
  };

  // 调用微信 API
  const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(wechatPayload)
  });

  const result = await response.json() as WechatApiResponse;

  // Token 失效自动重试逻辑
  if (result.errcode === 40001 && !isRetry) {
    // Token 无效，删除 KV 缓存并重试
    const kv = getKV(env);
    await kv.delete('access_token');
    return await sendWechatMessage(env, payload, true);
  }

  return result;
}

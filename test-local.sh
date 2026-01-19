#!/bin/bash

# FlareMsg 本地测试脚本
# 使用方法: ./test-local.sh

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FlareMsg 本地测试 ===${NC}\n"

# 询问配置
echo -e "${YELLOW}请输入测试配置:${NC}"
read -p "CLIENT_AUTH_TOKEN (鉴权密钥): " TOKEN
read -p "WECHAT_OPENID (微信 OpenID): " OPENID
read -p "服务地址 (默认: http://localhost:8787): " URL

# 使用默认值
URL=${URL:-http://localhost:8787}

# 验证输入
if [ -z "$TOKEN" ] || [ -z "$OPENID" ]; then
    echo -e "${RED}错误: TOKEN 和 OPENID 不能为空${NC}"
    exit 1
fi

echo -e "\n${GREEN}配置完成，开始测试...${NC}\n"

# 测试 1: 基础发送
echo -e "${YELLOW}测试 1: 基础发送（仅必填参数）${NC}"
response=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"openid\": \"$OPENID\",
    \"desc\": \"本地测试消息 - $(date '+%Y-%m-%d %H:%M:%S')\"
  }")
echo "响应: $response"
if echo "$response" | grep -q '"errcode":0'; then
    echo -e "${GREEN}✓ 测试通过${NC}\n"
else
    echo -e "${RED}✗ 测试失败${NC}\n"
fi

# 测试 2: 完整参数
echo -e "${YELLOW}测试 2: 完整参数发送${NC}"
response=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"openid\": \"$OPENID\",
    \"from\": \"本地测试系统\",
    \"desc\": \"这是一条完整参数的测试消息\",
    \"remark\": \"测试时间: $(date '+%Y-%m-%d %H:%M:%S')\",
    \"url\": \"https://github.com\"
  }")
echo "响应: $response"
if echo "$response" | grep -q '"errcode":0'; then
    echo -e "${GREEN}✓ 测试通过${NC}\n"
else
    echo -e "${RED}✗ 测试失败${NC}\n"
fi

# 测试 3: Header 鉴权
echo -e "${YELLOW}测试 3: 使用 Header 鉴权${NC}"
response=$(curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"openid\": \"$OPENID\",
    \"desc\": \"Header 鉴权测试\"
  }")
echo "响应: $response"
if echo "$response" | grep -q '"errcode":0'; then
    echo -e "${GREEN}✓ 测试通过${NC}\n"
else
    echo -e "${RED}✗ 测试失败${NC}\n"
fi

# 测试 4: 鉴权失败（预期失败）
echo -e "${YELLOW}测试 4: 鉴权失败测试（预期返回 401）${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"wrong_token\",
    \"openid\": \"$OPENID\",
    \"desc\": \"测试消息\"
  }")
echo "响应: $response"
if echo "$response" | grep -q "HTTP_CODE:401"; then
    echo -e "${GREEN}✓ 测试通过（正确返回 401）${NC}\n"
else
    echo -e "${RED}✗ 测试失败（应该返回 401）${NC}\n"
fi

# 测试 5: 缺少必填参数（预期失败）
echo -e "${YELLOW}测试 5: 缺少 openid 测试（预期返回 400）${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"desc\": \"测试消息\"
  }")
echo "响应: $response"
if echo "$response" | grep -q "HTTP_CODE:400"; then
    echo -e "${GREEN}✓ 测试通过（正确返回 400）${NC}\n"
else
    echo -e "${RED}✗ 测试失败（应该返回 400）${NC}\n"
fi

# 测试 6: 错误的 HTTP 方法（预期失败）
echo -e "${YELLOW}测试 6: GET 请求测试（预期返回 405）${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET $URL)
echo "响应: $response"
if echo "$response" | grep -q "HTTP_CODE:405"; then
    echo -e "${GREEN}✓ 测试通过（正确返回 405）${NC}\n"
else
    echo -e "${RED}✗ 测试失败（应该返回 405）${NC}\n"
fi

echo -e "${YELLOW}=== 测试完成 ===${NC}"

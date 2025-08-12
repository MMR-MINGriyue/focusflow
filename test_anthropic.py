
import anthropic
import os

# 获取API密钥
api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    api_key = input("请输入您的Anthropic API密钥: ")

# 初始化客户端
client = anthropic.Anthropic(api_key=api_key)

# 尝试发送一个简单的消息
try:
    # 使用更新的模型名称
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        temperature=0.0,
        messages=[
            {"role": "user", "content": "Hello, Claude!"}
        ]
    )
    print("回复:", message.content[0].text)
except Exception as e:
    print("错误:", e)
    print("请检查您的API密钥是否正确，以及账户是否有足够的额度。")

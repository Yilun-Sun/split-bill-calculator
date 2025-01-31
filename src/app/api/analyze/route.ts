import OpenAI from 'openai';

export const maxDuration = 30;

// 获取百度 access token 的函数
async function getBaiduAccessToken() {
  const response = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`,
    {
      method: 'POST',
    },
  );

  const data = await response.json();
  return data.access_token;
}

interface BaiduOCRResponse {
  words_result: Array<{
    words: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // 将图片转换为 base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // 获取百度 access token
    const accessToken = await getBaiduAccessToken();

    // 调用百度 OCR API
    const ocrResponse = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}`,
      },
    );

    const ocrResult = (await ocrResponse.json()) as BaiduOCRResponse;
    const text = ocrResult.words_result.map((item) => item.words).join('\n');

    const deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const prompt = `请首先识别这是哪个餐饮品牌的订单（如肯德基、麦当劳等），然后根据不同品牌的格式规则解析订单。

特别说明 - 肯德基订单格式规则：
1. 基本格式：
   商品名称(数量)
   ￥实付价
   x数量 商品名称
   ￥原价
   x份数

2. 示例解析：
   吮指原味鸡(4块)     -> 表示这个套餐包含4块鸡
   ￥29.9              -> 实付价格
   x4吮指原味鸡        -> 可以忽略，是重复信息
   ￥56                -> 原价，忽略
   x1                  -> 订购1份

3. 简单商品格式：
   醇香土豆泥          -> 商品名称
   ￥9                 -> 单价
   x2                 -> 订购2份

4. 套餐格式：
   V我50套餐 ￥50
   x4吮指原味鸡
   x6葡式蛋挞(1只)
   -> 需要拆分套餐内容，并根据单品价格计算各项商品的实际价格

处理规则：
1. 优先使用实付价格，忽略原价
2. 如果看到 "(n块/个/份)" 格式，这表示单个套餐内的数量
3. 如果看到 "xn" 格式，这表示订购份数
4. 套餐需要拆分成单品，并标注来源
5. 同一商品的不同价格，使用单独定价作为参考
6. 确保最终总价等于账单实付金额

账单文字内容：
${text}

请按照以下步骤分析：
1. 识别订单品牌
2. 找出账单的最终支付金额（"合计"、"实付"等字样后的金额）
3. 按照品牌特定格式解析所有商品
4. 处理所有套餐，拆分成单品
5. 计算正确的实付价格

请以下面的 JSON 格式返回数据：
{
  "brand": "品牌名称",
  "items": [
    {
      "name": "商品名称（如果来自套餐，需标注套餐名）",
      "quantity": 数量,
      "price": 实付价格
    }
  ],
  "extraFees": [
    {
      "name": "费用名称",
      "amount": 金额,
      "type": "perOrder"
    }
  ],
  "summary": {
    "totalDiscount": 优惠总额,
    "finalAmount": 最终支付金额
  }
}

注意：
1. 只返回 JSON 数据，不要其他说明文字
2. 数字必须是数值类型，不能带引号
3. 商品名称不应包含数量信息，数量应该在 quantity 字段中
4. 价格必须使用最终实付金额，不要使用原价
5. 所有商品价格之和加上额外费用必须等于 summary.finalAmount
6. 套餐内的商品需要在名称中标注来源，如"xxx(套餐名)"
7. 如果有重复商品但价格不同，优先使用单独定价的价格`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Empty response from Deepseek');
      }

      let content = response.choices[0].message.content;

      // 清理可能的前后缀文本
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.slice(7);
      }
      if (content.endsWith('```')) {
        content = content.slice(0, -3);
      }
      content = content.trim();

      // 尝试解析 JSON
      try {
        const parsedContent = JSON.parse(content);
        return Response.json(parsedContent);
      } catch (e) {
        console.error('JSON Parse Error:', e);
        console.error('Failed content:', content);
        return Response.json(
          { error: 'Invalid JSON response from AI' },
          { status: 500 },
        );
      }
    } catch (deepseekError) {
      console.error('Deepseek API Error:', deepseekError);
      return Response.json(
        { error: 'Failed to get response from AI' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('General API Error:', error);
    return Response.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

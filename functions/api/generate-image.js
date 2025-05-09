export async function onRequestPost(context) {
  try {
    // 从环境变量获取API Key
    const apiKey = context.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API Key未配置' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 解析请求体
    const requestData = await context.request.json();
    const { prompt, style, ratio } = requestData;

    // 调用阿里云百炼API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        input: {
          prompt: prompt,
        },
        parameters: {
          style: style || 'photo',
          size: ratio || '1024*1024',
          n: 1,
        }
      })
    });

    const result = await response.json();
    
    // 返回结果给前端
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || '处理请求失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
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

    console.log('文生图请求：', { prompt, style, ratio });

    // 添加比例转换逻辑
    let apiSize = '1024*1024'; // 默认值
    if (ratio) {
      switch(ratio) {
        case '1:1': apiSize = '1024*1024'; break;
        case '4:3': apiSize = '1024*768'; break;
        case '16:9': apiSize = '1024*576'; break;
        default: apiSize = ratio.includes('*') ? ratio : '1024*1024';
      }
    }

    // 调用阿里云百炼API
    const requestBody = {
      model: 'wanx-v1',
      input: {
        prompt: prompt,
      },
      parameters: {
        style: style || 'photo',
        size: ratio || '1024*1024',
        n: 1,
      }
    };

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('API返回结果：', result);
    
    // 在返回结果之前记录详细的响应内容
    console.log('API返回的原始结果：', JSON.stringify(result));

    // 包装结果以符合前端预期格式
    const wrappedResult = {
      output: {
        results: result.output && result.output.results ? result.output.results : [{url: '生成失败'}]
      }
    };

    // 返回包装后的结果
    return new Response(JSON.stringify(wrappedResult), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('处理请求失败：', error);
    return new Response(JSON.stringify({ 
      error: error.message || '处理请求失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
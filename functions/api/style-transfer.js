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

    // 获取FormData
    const formData = await context.request.formData();
    const imageFile = formData.get('image');
    const style = formData.get('style');
    
    console.log('风格转换请求：', { style, imageFile: imageFile ? '已上传' : '未上传' });
    
    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ 
        error: '请提供有效的图片文件' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 将图片转为base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // 调用阿里云百炼API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/style-transfer/style-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'wanx-style-transfer-v1',
        input: {
          image: `data:${imageFile.type};base64,${base64Image}`,
        },
        parameters: {
          style_name: style || 'watercolor'
        }
      })
    });

    const result = await response.json();
    console.log('API返回结果：', result);
    
    // 返回结果给前端
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('风格转换失败：', error);
    return new Response(JSON.stringify({ 
      error: error.message || '风格转换失败' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

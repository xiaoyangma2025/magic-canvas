export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '只支持POST请求' }), { status: 405 });
    }

    const body = await request.json();
    const { prompt, style = 'default', ratio = '1:1' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: '描述文本不能为空' }), { status: 400 });
    }

    // 映射风格
    let modelStyle = "default";
    if (style === "watercolor") modelStyle = "watercolor";
    else if (style === "photo") modelStyle = "photographic";
    else if (style === "cartoon") modelStyle = "cartoon";
    else if (style === "oil") modelStyle = "oil-painting";
    else if (style === "art") modelStyle = "artistic";

    // 解析尺寸
    let width = 1024, height = 1024;
    if (ratio === '4:3') { width = 1024; height = 768; }
    else if (ratio === '16:9') { width = 1024; height = 576; }
    else if (ratio.includes('*')) {
      const [w, h] = ratio.split('*').map(Number);
      if (!isNaN(w) && !isNaN(h)) { width = w; height = h; }
    }

    // 构造阿里云API请求
    const apiKey = env.ALIBABA_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key未配置' }), { status: 503 });
    }

    const apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1/models/wanx-v1/generation';
    const requestData = {
      input: { prompt },
      parameters: { width, height, n: 1, style: modelStyle }
    };

    const aliyunRes = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });

    const aliyunData = await aliyunRes.json();

    // 兼容多种返回格式
    let imageUrl = null;
    if (aliyunData?.output?.url) imageUrl = aliyunData.output.url;
    else if (aliyunData?.output?.results?.length) imageUrl = aliyunData.output.results[0].url;
    else if (aliyunData?.images?.length) imageUrl = aliyunData.images[0].url;
    else if (aliyunData?.result?.url) imageUrl = aliyunData.result.url;

    if (imageUrl) {
      // 直接返回图片URL给前端
      return new Response(JSON.stringify({ success: true, image: imageUrl, message: '图片生成成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'API返回格式无效', raw: aliyunData }), { status: 500 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
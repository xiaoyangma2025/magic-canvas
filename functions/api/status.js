export async function onRequest(context) {
  // 如果阿里云API是同步生成图片，status接口可以直接返回“已完成”
  return new Response(JSON.stringify({ status: 'done', message: '图片已生成' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
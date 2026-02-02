/**
 * Vercel Serverless：代理新浪行情接口，并带上 Referer 等请求头（线上 rewrite 不会自动带这些头，新浪会拦截）
 */
export default async function handler(req, res) {
  const path = req.query.path || '';
  if (!path) {
    res.status(400).json({ error: 'missing path' });
    return;
  }

  const url = `https://hq.sinajs.cn/${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.sina.com.cn/',
        'Accept': '*/*',
      },
    });

    const contentType = response.headers.get('content-type') || 'text/plain; charset=gbk';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status);

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (e) {
    console.error('proxy sina error:', e);
    res.status(502).json({ error: 'proxy failed' });
  }
}

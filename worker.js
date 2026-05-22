export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const country = request.cf?.country || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Structured logging for incoming request (SRE standard)
    console.log(`[REQUEST] ${request.method} ${url.pathname} | IP: ${clientIP} | Country: ${country} | UA: ${userAgent}`);

    let response;
    let isFallback = false;

    try {
      // Fetch the response from the static assets
      response = await env.ASSETS.fetch(request);

      // If the asset is not found (e.g. 404), fallback to index.html for SPA routing
      if (response.status === 404) {
        isFallback = true;
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        response = await env.ASSETS.fetch(indexRequest);
        console.warn(`[ROUTING] 404 Fallback triggered for path: ${url.pathname} -> Served index.html`);
      }
    } catch (err) {
      console.error(`[ERROR] Asset fetch failed for ${url.pathname}: ${err.message}`, err.stack);
      return new Response('Internal Server Error', { status: 500 });
    }

    // Clone the response headers to allow modification (response.headers are immutable)
    const newHeaders = new Headers(response.headers);

    // Inject strong security headers at the Cloudflare Edge (Compute)
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add custom SLA & Environment headers for standard production alignment
    newHeaders.set('X-Environment', env.ENVIRONMENT || 'production');
    newHeaders.set('X-SLA-Target', env.SLA_TARGET || '99.99%');

    const duration = Date.now() - startTime;
    
    // Log response metrics for observability dashboard
    if (response.status >= 400) {
      console.error(`[RESPONSE] ${request.method} ${url.pathname} - Status: ${response.status} - Time: ${duration}ms | Fallback: ${isFallback}`);
    } else {
      console.log(`[RESPONSE] ${request.method} ${url.pathname} - Status: ${response.status} - Time: ${duration}ms | Fallback: ${isFallback}`);
    }

    // Return the response with modern edge security headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};

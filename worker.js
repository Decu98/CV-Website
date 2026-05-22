export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Fetch the response from the static assets
    let response = await env.ASSETS.fetch(request);

    // If the asset is not found (e.g. 404), fallback to index.html for SPA routing
    if (response.status === 404) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
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

    // Return the response with modern edge security headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};

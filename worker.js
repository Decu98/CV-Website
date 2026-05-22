export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const country = request.cf?.country || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Structured logging for incoming request (SRE standard)
    console.log(`[REQUEST] ${request.method} ${url.pathname} | IP: ${clientIP} | Country: ${country} | UA: ${userAgent}`);

    // Standard security and content headers for JSON responses
    const jsonHeaders = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Environment': env.ENVIRONMENT || 'production',
      'X-SLA-Target': env.SLA_TARGET || '99.99%'
    };

    // Intercept POST request for contact form API
    if (request.method === 'POST' && url.pathname === '/api/contact') {
      try {
        const bodyText = await request.text();
        let payload;
        try {
          payload = JSON.parse(bodyText);
        } catch (e) {
          console.error(`[API ERROR] Invalid JSON payload from IP ${clientIP}`);
          return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload.' }), {
            status: 400,
            headers: jsonHeaders
          });
        }

        const { name, email, message } = payload || {};

        // Basic validation
        if (!name || !email || !message || name.trim() === '' || email.trim() === '' || message.trim() === '') {
          console.error(`[API ERROR] Validation failed from IP ${clientIP}: missing parameters`);
          return new Response(JSON.stringify({ success: false, error: 'All fields (name, email, message) are required.' }), {
            status: 400,
            headers: jsonHeaders
          });
        }

        // Email validation (simple regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          console.error(`[API ERROR] Validation failed from IP ${clientIP}: invalid email ${email}`);
          return new Response(JSON.stringify({ success: false, error: 'Invalid email address format.' }), {
            status: 400,
            headers: jsonHeaders
          });
        }

        const now = new Date().toISOString();

        // Check if Resend API Key is defined
        if (!env.RESEND_API_KEY) {
          console.warn(`[WARNING] RESEND_API_KEY is not defined. Simulating successful form submission.`);
          // Log structured payload details for SRE auditability
          console.log(`[MOCK EMAIL] To: dec.bartlomiej09@gmail.com | Subject: Nowy kontakt z portfolio: ${name}`);
          console.log(`[MOCK EMAIL CONTENT]\nName: ${name}\nEmail: ${email}\nMessage: ${message}\nTelemetry -> IP: ${clientIP}, Country: ${country}, UA: ${userAgent}`);
          
          return new Response(JSON.stringify({ success: true, mock: true }), {
            status: 200,
            headers: jsonHeaders
          });
        }

        // SRE Telemetry structured email body (premium UI for the email)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f4f5f7;
                color: #333333;
                margin: 0;
                padding: 20px;
              }
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e1e4e8;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              }
              .header {
                background: linear-gradient(135deg, #9d4edd, #6366f1, #0af5ff);
                color: #ffffff;
                padding: 24px;
                text-align: center;
              }
              .header h2 {
                margin: 0;
                font-size: 22px;
                letter-spacing: 0.5px;
              }
              .content {
                padding: 30px;
              }
              .field {
                margin-bottom: 20px;
              }
              .label {
                font-size: 11px;
                text-transform: uppercase;
                color: #888888;
                letter-spacing: 1px;
                margin-bottom: 5px;
                font-weight: bold;
              }
              .value {
                font-size: 16px;
                line-height: 1.5;
                color: #111111;
              }
              .message-box {
                background-color: #f8fafc;
                border-left: 4px solid #6366f1;
                padding: 15px;
                border-radius: 4px;
                font-style: italic;
                white-space: pre-wrap;
              }
              .footer {
                background-color: #0f172a;
                color: #94a3b8;
                padding: 20px 30px;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
              }
              .footer-title {
                font-weight: bold;
                color: #38bdf8;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h2>Nowy Kontakt z Portfolio</h2>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Nadawca (Imię / Firma)</div>
                  <div class="value"><strong>${name}</strong></div>
                </div>
                <div class="field">
                  <div class="label">Adres E-mail</div>
                  <div class="value"><a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a></div>
                </div>
                <div class="field">
                  <div class="label">Wiadomość</div>
                  <div class="value message-box">${message}</div>
                </div>
              </div>
              <div class="footer">
                <div class="footer-title">Telemetry & Edge SRE Metadata</div>
                <div class="meta-grid">
                  <div><strong>Client IP:</strong> ${clientIP}</div>
                  <div><strong>Country Code:</strong> ${country}</div>
                  <div><strong>Timestamp:</strong> ${now}</div>
                  <div style="grid-column: span 2; margin-top: 5px;"><strong>User-Agent:</strong> ${userAgent}</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Dispatch call to Resend API
        const resendFrom = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const resendTo = env.RESEND_TO_EMAIL || 'dec.bartlomiej09@gmail.com';

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `Portfolio Contact <${resendFrom}>`,
            to: resendTo,
            subject: `[Portfolio Contact] Wiadomość od ${name}`,
            html: htmlContent
          })
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok) {
          console.log(`[API SUCCESS] Email sent successfully via Resend. ID: ${resendData.id} | IP: ${clientIP}`);
          return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            status: 200,
            headers: jsonHeaders
          });
        } else {
          console.error(`[API ERROR] Resend dispatch failed with status ${resendResponse.status}: ${JSON.stringify(resendData)}`);
          return new Response(JSON.stringify({ success: false, error: 'Failed to dispatch email via Resend API.' }), {
            status: 502,
            headers: jsonHeaders
          });
        }
      } catch (err) {
        console.error(`[API ERROR] Crash inside POST /api/contact handler: ${err.message}`, err.stack);
        return new Response(JSON.stringify({ success: false, error: 'Internal Server Error.' }), {
          status: 500,
          headers: jsonHeaders
        });
      }
    }

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

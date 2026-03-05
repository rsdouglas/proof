/**
 * Cloudflare Pages _worker.js
 *
 * Intercepts /c/[id] requests and proxies them to the API worker,
 * keeping the URL on socialproof.dev instead of redirecting to api.socialproof.dev.
 *
 * Everything else falls through to CF Pages static asset serving.
 *
 * Issue #199: collection form should stay on socialproof.dev/c/[id]
 * Issue #245: switch from pages functions to _worker.js for reliability
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: GET /c/[id] — show the collection form
    const formMatch = url.pathname.match(/^\/c\/([^/]+)$/);
    if (formMatch) {
      const id = formMatch[1];
      if (request.method === 'GET') {
        try {
          const apiUrl = `https://api.socialproof.dev/submit/${id}`;
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html',
              'User-Agent': request.headers.get('User-Agent') || '',
            }
          });
          const html = await response.text();
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
              'X-SocialProof-Via': 'pages-worker',
            }
          });
        } catch (err) {
          return new Response(
            '<html><body><div style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto"><h1>Form not found</h1><p>This collection form doesn\'t exist or has been deactivated.</p></div></body></html>',
            {
              status: 404,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }
      }
      // Non-GET to /c/[id] — not allowed
      return new Response('Method not allowed', { status: 405 });
    }

    // Route: POST /c/submit/[id] — submit a testimonial
    const submitMatch = url.pathname.match(/^\/c\/submit\/([^/]+)$/);
    if (submitMatch && request.method === 'POST') {
      const id = submitMatch[1];
      const apiUrl = `https://api.socialproof.dev/c/submit/${id}`;
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': request.headers.get('Content-Type') || 'application/json',
            'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '',
            'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
          },
          body: request.body
        });
        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Submit failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Everything else: static assets from CF Pages
    return env.ASSETS.fetch(request);
  }
};

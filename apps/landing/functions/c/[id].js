/**
 * Cloudflare Pages Function: /c/[id]
 * 
 * Proxies requests to api.socialproof.dev/submit/[id] so the URL stays
 * on socialproof.dev instead of redirecting to the API subdomain.
 * 
 * Issue #199: collection form should stay on socialproof.dev/c/[id]
 * Issue #241: fix for function not being invoked
 */

export async function onRequest(context) {
  const { params, request } = context
  const id = params.id

  const method = request.method

  // For GET requests, proxy the form HTML from the API
  if (method === 'GET') {
    try {
      const apiUrl = `https://api.socialproof.dev/submit/${id}`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': request.headers.get('User-Agent') || '',
        }
      })

      const html = await response.text()
      
      // Always return 200 so CF Pages doesn't fall back to static index.html
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Vouch-Via': 'pages-function',
        }
      })
    } catch (err) {
      return new Response(`<html><body><div style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto"><h1>Form not found</h1><p>This collection form doesn't exist or has been deactivated.</p></div></body></html>`, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }
  }

  return new Response('Not found', { status: 404 })
}

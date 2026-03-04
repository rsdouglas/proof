/**
 * Cloudflare Pages Function: /c/[id]
 * 
 * Proxies requests to api.socialproof.dev/submit/[id] so the URL stays
 * on socialproof.dev instead of redirecting to the API subdomain.
 * 
 * Issue #199: collection form should stay on socialproof.dev/c/[id]
 */

export async function onRequest(context) {
  const { params, request } = context
  const id = params.id

  const url = new URL(request.url)
  const method = request.method

  // For GET requests, proxy the form HTML from the API
  if (method === 'GET') {
    const apiUrl = `https://api.socialproof.dev/submit/${id}`
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': request.headers.get('Accept') || 'text/html',
        'User-Agent': request.headers.get('User-Agent') || '',
        'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '',
      }
    })

    // Rewrite the HTML to fix the POST URL: the form posts to /c/submit/:id
    // which on api.socialproof.dev resolves correctly since collect route
    // is mounted at /c. On socialproof.dev we need to proxy that too.
    // The form already uses relative /c/submit/:id which will hit our function.
    const html = await response.text()
    
    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      }
    })
  }

  // 404 for anything else at this path
  return new Response('Not found', { status: 404 })
}

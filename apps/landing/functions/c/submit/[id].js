/**
 * Cloudflare Pages Function: POST /c/submit/[id]
 * 
 * Proxies form submissions to api.socialproof.dev/c/submit/[id]
 * so form posts stay on socialproof.dev.
 * 
 * Issue #199
 */

export async function onRequestPost(context) {
  const { params, request } = context
  const id = params.id

  const apiUrl = `https://api.socialproof.dev/c/submit/${id}`
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '',
      'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
    },
    body: request.body,
  })

  const data = await response.text()
  
  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    }
  })
}

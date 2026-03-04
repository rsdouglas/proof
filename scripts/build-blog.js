#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { marked } = require('marked')
const matter = require('gray-matter')

const ROOT = path.join(__dirname, '..')
const BLOG_SRC = path.join(ROOT, 'blog')
const BLOG_OUT = path.join(ROOT, 'apps', 'landing', 'blog')

function getNavAndStyles() {
  const index = fs.readFileSync(path.join(ROOT, 'apps', 'landing', 'index.html'), 'utf8')
  const styleMatch = index.match(/<style>([\s\S]*?)<\/style>/)
  const navMatch = index.match(/<nav>([\s\S]*?)<\/nav>/)
  return {
    styles: styleMatch ? styleMatch[1] : '',
    nav: navMatch ? `<nav>${navMatch[1]}</nav>` : ''
  }
}

function buildPost(slug, frontmatter, content, nav, styles) {
  const html = marked(content)
  const dateStr = frontmatter.date
    ? new Date(frontmatter.date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title} — Vouch</title>
  <meta name="description" content="${(frontmatter.description || '').replace(/"/g, '&quot;')}">
  <style>
${styles}
    .blog-post { max-width: 680px; margin: 80px auto; padding: 0 24px 80px; }
    .blog-post h1 { font-size: 2rem; font-weight: 700; margin-bottom: 12px; line-height: 1.3; }
    .blog-date { color: var(--muted); font-size: 14px; margin-bottom: 48px; }
    .blog-body h2 { font-size: 1.35rem; font-weight: 700; margin: 40px 0 16px; }
    .blog-body h3 { font-size: 1.1rem; font-weight: 600; margin: 32px 0 12px; }
    .blog-body p { margin-bottom: 20px; line-height: 1.75; color: var(--text); }
    .blog-body ul, .blog-body ol { margin: 0 0 20px 24px; }
    .blog-body li { margin-bottom: 8px; line-height: 1.7; }
    .blog-body strong { color: #fff; }
    .blog-body a { color: var(--purple-light); text-decoration: none; }
    .blog-body a:hover { text-decoration: underline; }
    .blog-body hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
    .blog-body blockquote { border-left: 3px solid var(--purple); padding-left: 20px; color: var(--muted); margin: 24px 0; }
    .blog-body code { background: var(--mid); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    .blog-cta { background: var(--mid); border: 1px solid var(--border); border-radius: 12px; padding: 40px; text-align: center; margin-top: 60px; }
    .blog-cta h3 { font-size: 1.3rem; margin-bottom: 12px; }
    .blog-cta p { color: var(--muted); margin-bottom: 24px; }
    .back-link { display: inline-block; color: var(--muted); text-decoration: none; font-size: 14px; margin-bottom: 40px; }
    .back-link:hover { color: var(--text); }
  </style>
</head>
<body>
${nav}
<div class="blog-post">
  <a class="back-link" href="/blog">&#8592; All posts</a>
  <h1>${frontmatter.title}</h1>
  <p class="blog-date">${dateStr}</p>
  <div class="blog-body">
    ${html}
  </div>
  <div class="blog-cta">
    <h3>Collect testimonials that actually convert</h3>
    <p>Vouch makes it easy to gather and display social proof — no coding required.</p>
    <a class="btn btn-primary" href="https://app.socialproof.dev/register">Start free &#8594;</a>
  </div>
</div>
</body>
</html>`
}

function buildIndex(posts, nav, styles) {
  const postCards = posts.map(p => {
    const dateStr = p.date
      ? new Date(p.date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
      : ''
    return `
    <a class="blog-card" href="/blog/${p.slug}">
      <div class="blog-card-date">${dateStr}</div>
      <h2 class="blog-card-title">${p.title}</h2>
      <p class="blog-card-excerpt">${p.description || ''}</p>
      <span class="blog-read-more">Read more &#8594;</span>
    </a>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog &#8212; Vouch</title>
  <meta name="description" content="Guides and resources for collecting testimonials and growing your business with social proof.">
  <style>
${styles}
    .blog-index { max-width: 720px; margin: 80px auto; padding: 0 24px 80px; }
    .blog-index h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 8px; }
    .blog-index .subtitle { color: var(--muted); margin-bottom: 48px; font-size: 1.05rem; }
    .blog-card { display: block; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 28px 32px; margin-bottom: 20px; text-decoration: none; transition: border-color 0.2s, background 0.2s; }
    .blog-card:hover { border-color: var(--purple); background: rgba(108,92,231,0.05); }
    .blog-card-date { color: var(--muted); font-size: 13px; margin-bottom: 10px; }
    .blog-card-title { font-size: 1.2rem; font-weight: 700; color: var(--text); margin-bottom: 10px; }
    .blog-card-excerpt { color: var(--muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 16px; }
    .blog-read-more { color: var(--purple-light); font-size: 14px; }
  </style>
</head>
<body>
${nav}
<div class="blog-index">
  <h1>Blog</h1>
  <p class="subtitle">Guides on testimonials, social proof, and growing your small business.</p>
  ${postCards}
</div>
</body>
</html>`
}

// Main
fs.mkdirSync(BLOG_OUT, { recursive: true })

const { styles, nav } = getNavAndStyles()
const files = fs.readdirSync(BLOG_SRC).filter(f => f.endsWith('.md'))

const posts = files.map(filename => {
  const raw = fs.readFileSync(path.join(BLOG_SRC, filename), 'utf8')
  const { data, content } = matter(raw)
  return { ...data, content, slug: data.slug || filename.replace('.md', '') }
}).sort((a, b) => new Date(b.date) - new Date(a.date))

fs.writeFileSync(path.join(BLOG_OUT, 'index.html'), buildIndex(posts, nav, styles))
console.log('Generated blog/index.html')

for (const post of posts) {
  const dir = path.join(BLOG_OUT, post.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), buildPost(post.slug, post, post.content, nav, styles))
  console.log('Generated blog/' + post.slug + '/index.html')
}

console.log('Blog build complete.')

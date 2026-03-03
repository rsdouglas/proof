#!/usr/bin/env node
/**
 * Build script: converts /blog/*.md -> /apps/landing/blog/[slug].html
 * Also generates /apps/landing/blog/index.html listing all posts.
 * Run: node scripts/build-blog.js
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const BLOG_SRC = path.join(__dirname, '../blog');
const BLOG_OUT = path.join(__dirname, '../apps/landing/blog');

if (!fs.existsSync(BLOG_OUT)) fs.mkdirSync(BLOG_OUT, { recursive: true });

const sharedStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --purple: #6C5CE7;
    --purple-light: #a29bfe;
    --dark: #0f0e17;
    --mid: #1e1c2e;
    --text: #e8e6f0;
    --muted: #9ca3af;
    --border: rgba(108,92,231,0.2);
    --card-bg: rgba(255,255,255,0.04);
  }
  html { scroll-behavior: smooth; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--dark); color: var(--text); line-height: 1.7; }
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 6%; height: 64px;
    background: rgba(15,14,23,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo { font-size: 20px; font-weight: 700; color: var(--text); text-decoration: none; letter-spacing: -0.4px; }
  .nav-logo span { color: var(--purple); }
  .nav-links { display: flex; align-items: center; gap: 28px; }
  .nav-links a { color: var(--muted); text-decoration: none; font-size: 15px; transition: color 0.2s; }
  .nav-links a:hover { color: var(--text); }
  .btn { display: inline-flex; align-items: center; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
  .btn-primary { background: var(--purple); color: #fff; }
  .btn-primary:hover { background: #7c6cf0; transform: translateY(-1px); }
  main { padding-top: 64px; }
  footer { border-top: 1px solid var(--border); padding: 40px 6%; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 14px; margin-top: 80px; }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--text); }
  @media (max-width: 640px) { .nav-links .btn { display: none; } footer { flex-direction: column; gap: 16px; text-align: center; } }
`;

const NAV = `<nav>
  <a class="nav-logo" href="/">&#10022; <span>Vouch</span></a>
  <div class="nav-links">
    <a href="/blog">Blog</a>
    <a href="/#pricing">Pricing</a>
    <a href="https://app.socialproof.dev">Log in</a>
    <a class="btn btn-primary" href="https://app.socialproof.dev/register">Start for free</a>
  </div>
</nav>`;

const FOOTER = `<footer>
  <a class="nav-logo" href="/">&#10022; <span style="color:var(--purple)">Vouch</span></a>
  <div style="display:flex;gap:24px">
    <a href="/">Home</a>
    <a href="/blog">Blog</a>
    <a href="mailto:hello@socialproof.dev">Contact</a>
  </div>
  <p>&copy; ${new Date().getFullYear()} Vouch. All rights reserved.</p>
</footer>`;

const mdFiles = fs.readdirSync(BLOG_SRC).filter(f => f.endsWith('.md'));
const posts = [];

for (const file of mdFiles) {
  const raw = fs.readFileSync(path.join(BLOG_SRC, file), 'utf8');
  const { data, content } = matter(raw);
  if (!data.slug) { console.warn('Skipping ' + file + ' - no slug'); continue; }

  const html = marked(content);
  const tags = (data.tags || []).map(t => '<span class="tag">' + t + '</span>').join('');
  const dateStr = data.date ? new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const postHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} &mdash; Vouch Blog</title>
  <meta name="description" content="${(data.description || '').replace(/"/g, '&quot;')}">
  <meta property="og:title" content="${data.title}">
  <meta property="og:description" content="${(data.description || '').replace(/"/g, '&quot;')}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary">
  <style>
${sharedStyles}
    .post-hero { padding: 80px 0 48px; background: linear-gradient(180deg, rgba(108,92,231,0.08) 0%, transparent 100%); border-bottom: 1px solid var(--border); }
    .post-hero-inner { max-width: 760px; margin: 0 auto; padding: 0 24px; }
    .post-meta { display: flex; align-items: center; gap: 12px; color: var(--muted); font-size: 14px; margin-bottom: 20px; flex-wrap: wrap; }
    .tag { display: inline-block; background: rgba(108,92,231,0.15); color: var(--purple-light); padding: 2px 10px; border-radius: 20px; font-size: 13px; }
    h1.post-title { font-size: clamp(28px,5vw,44px); font-weight: 800; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
    .post-description { font-size: 18px; color: var(--muted); line-height: 1.6; }
    .post-content { max-width: 760px; margin: 48px auto 80px; padding: 0 24px; }
    .post-content h1, .post-content h2 { font-size: 24px; font-weight: 700; margin: 40px 0 16px; }
    .post-content h3 { font-size: 19px; font-weight: 600; margin: 32px 0 12px; }
    .post-content p { margin-bottom: 18px; color: #d1cde8; }
    .post-content ul, .post-content ol { margin: 0 0 18px 24px; color: #d1cde8; }
    .post-content li { margin-bottom: 8px; }
    .post-content strong { color: var(--text); }
    .post-content em { color: var(--purple-light); font-style: italic; }
    .post-content blockquote { border-left: 3px solid var(--purple); margin: 24px 0; padding: 16px 20px; background: var(--card-bg); border-radius: 0 8px 8px 0; }
    .post-content blockquote p { color: var(--text); margin: 0; font-style: italic; }
    .post-content hr { border: none; border-top: 1px solid var(--border); margin: 36px 0; }
    .post-content a { color: var(--purple-light); text-decoration: underline; text-underline-offset: 3px; }
    .post-content code { background: var(--mid); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; color: var(--purple-light); }
    .post-content pre { background: var(--mid); padding: 20px; border-radius: 8px; overflow-x: auto; margin-bottom: 18px; }
    .post-content pre code { background: none; padding: 0; }
    .cta-box { background: linear-gradient(135deg,rgba(108,92,231,0.15),rgba(108,92,231,0.05)); border: 1px solid var(--border); border-radius: 16px; padding: 40px; text-align: center; margin-top: 60px; }
    .cta-box h2 { margin: 0 0 12px !important; font-size: 24px !important; }
    .cta-box p { margin-bottom: 24px !important; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-size: 14px; margin-bottom: 32px; transition: color 0.2s; }
    .back-link:hover { color: var(--text); }
  </style>
</head>
<body>
${NAV}
<main>
  <div class="post-hero">
    <div class="post-hero-inner">
      <a class="back-link" href="/blog">&larr; All posts</a>
      <div class="post-meta">
        <span>${dateStr}</span>
        ${tags}
      </div>
      <h1 class="post-title">${data.title}</h1>
      ${data.description ? '<p class="post-description">' + data.description + '</p>' : ''}
    </div>
  </div>
  <div class="post-content">
    ${html}
    <div class="cta-box">
      <h2>Ready to put social proof to work?</h2>
      <p>Vouch collects testimonials and displays them anywhere on your site. Free to start, live in 5 minutes.</p>
      <a class="btn btn-primary" href="https://app.socialproof.dev/register" style="font-size:16px;padding:14px 28px">Start for free &rarr;</a>
    </div>
  </div>
</main>
${FOOTER}
</body>
</html>`;

  fs.writeFileSync(path.join(BLOG_OUT, data.slug + '.html'), postHtml);
  console.log('Built: ' + data.slug + '.html');
  posts.push({ slug: data.slug, title: data.title, description: data.description || '', date: data.date, dateStr, tags: data.tags || [] });
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

const postCards = posts.map(p => `
  <article class="post-card">
    <div class="post-card-meta">
      <span>${p.dateStr}</span>
      ${p.tags.slice(0, 2).map(t => '<span class="tag">' + t + '</span>').join('')}
    </div>
    <h2><a href="/blog/${p.slug}">${p.title}</a></h2>
    <p>${p.description}</p>
    <a class="read-more" href="/blog/${p.slug}">Read article &rarr;</a>
  </article>`).join('\n');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog &mdash; Vouch</title>
  <meta name="description" content="Practical guides on collecting testimonials, social proof, and converting more customers for small businesses.">
  <style>
${sharedStyles}
    .blog-hero { padding: 100px 6% 60px; background: linear-gradient(180deg,rgba(108,92,231,0.08) 0%,transparent 100%); border-bottom: 1px solid var(--border); text-align: center; }
    .blog-hero h1 { font-size: clamp(32px,6vw,56px); font-weight: 800; letter-spacing: -1px; margin-bottom: 16px; }
    .blog-hero p { font-size: 18px; color: var(--muted); max-width: 500px; margin: 0 auto; }
    .blog-list { max-width: 800px; margin: 60px auto 80px; padding: 0 24px; display: flex; flex-direction: column; gap: 32px; }
    .post-card { padding: 32px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; transition: border-color 0.2s, transform 0.2s; }
    .post-card:hover { border-color: rgba(108,92,231,0.5); transform: translateY(-2px); }
    .post-card-meta { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; margin-bottom: 12px; flex-wrap: wrap; }
    .tag { background: rgba(108,92,231,0.15); color: var(--purple-light); padding: 2px 10px; border-radius: 20px; font-size: 12px; }
    .post-card h2 { font-size: 22px; font-weight: 700; margin-bottom: 10px; }
    .post-card h2 a { color: var(--text); text-decoration: none; transition: color 0.2s; }
    .post-card h2 a:hover { color: var(--purple-light); }
    .post-card p { color: var(--muted); font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    .read-more { color: var(--purple-light); text-decoration: none; font-size: 14px; font-weight: 600; }
    .read-more:hover { text-decoration: underline; }
  </style>
</head>
<body>
${NAV}
<main>
  <div class="blog-hero">
    <h1>The Vouch Blog</h1>
    <p>Practical guides on social proof, testimonials, and growing your small business.</p>
  </div>
  <div class="blog-list">
    ${postCards}
  </div>
</main>
${FOOTER}
</body>
</html>`;

fs.writeFileSync(path.join(BLOG_OUT, 'index.html'), indexHtml);
console.log('Built: blog/index.html');
console.log('\nDone! Built ' + posts.length + ' post(s).');

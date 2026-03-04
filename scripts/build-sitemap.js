#!/usr/bin/env node
/**
 * Build script: generates /apps/landing/sitemap.xml
 * Includes all blog posts and main pages.
 * Run: node scripts/build-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOG_SRC = path.join(__dirname, '../blog');
const LANDING_OUT = path.join(__dirname, '../apps/landing');
const BASE_URL = 'https://getvouch.app';

const today = new Date().toISOString().split('T')[0];

// Static pages
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/blog/', priority: '0.8', changefreq: 'weekly' },
];

// Collect blog posts
const blogPosts = [];
for (const file of fs.readdirSync(BLOG_SRC)) {
  if (!file.endsWith('.md')) continue;
  const content = fs.readFileSync(path.join(BLOG_SRC, file), 'utf8');
  const { data } = matter(content);
  const slug = file.replace('.md', '');
  const date = data.date ? new Date(data.date).toISOString().split('T')[0] : today;
  blogPosts.push({ url: `/blog/${slug}`, date, priority: '0.7', changefreq: 'monthly' });
}

// Build XML
const urlEntries = [
  ...staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
  ...blogPosts.map(p => `  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
].join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

fs.writeFileSync(path.join(LANDING_OUT, 'sitemap.xml'), xml);
console.log(`Built sitemap.xml with ${staticPages.length + blogPosts.length} URLs`);

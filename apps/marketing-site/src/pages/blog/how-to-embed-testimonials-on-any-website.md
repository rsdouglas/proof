---
layout: ../../layouts/BlogPost.astro
title: "How to Embed Testimonials on Any Website (2026 Guide)"
description: "A technical how-to for embedding testimonial widgets on WordPress, Squarespace, Webflow, Wix, Shopify, and any custom site. With real code examples."
publishedAt: "2025-03-08"
author: "SocialProof Team"
---

# How to Embed Testimonials on Any Website (2025 Guide)

Whether you built your site on WordPress, Squarespace, Webflow, Wix, Shopify, or raw HTML, adding a live testimonial widget works essentially the same way: you paste one line of JavaScript, and the widget renders.

This guide covers how to do it on every major platform.

## The Embed Code

When you set up a testimonial widget with [SocialProof](https://socialproof.dev), you get a snippet that looks like this:

```html
<script src="https://cdn.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID" async></script>
```

Paste this code wherever you want testimonials to appear. The widget loads asynchronously — it doesn't slow your page down.

You also need a target element:

```html
<div id="socialproof-widget"></div>
<script src="https://cdn.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID" async></script>
```

Now let's look at how to add this on each platform.

---

## WordPress

### Method 1: Block Editor (Gutenberg)

1. Open the page or post you want to add testimonials to
2. Click **+** to add a new block
3. Search for **Custom HTML**
4. Select **Custom HTML** block
5. Paste your embed code
6. Click **Preview** to verify it renders
7. Publish/Update

### Method 2: Classic Editor

1. In the editor, click **Text** tab (not Visual)
2. Paste your embed code where you want it to appear
3. Switch back to **Visual** to check placement
4. Update/Publish

### Method 3: Widget Area (appears on all pages)

1. Go to **Appearance → Widgets**
2. Drag a **Custom HTML** widget to your sidebar or footer
3. Paste your embed code
4. Save

### WordPress Page Builders (Elementor, Divi, Beaver)

In any page builder:
1. Add an **HTML** or **Code** element
2. Paste the embed code
3. Save

---

## Squarespace

1. Open the page in the editor
2. Click **+** to add a new block
3. Search for **Code**
4. Select **Code Block**
5. Make sure **HTML** is selected (not JavaScript)
6. Paste your embed code
7. Apply

**Note:** Code Blocks require Squarespace Business plan or higher. Personal plan doesn't support custom code.

**For sitewide placement (footer):**
1. Go to **Settings → Advanced → Code Injection**
2. Paste in the **Footer** field
3. Save

---

## Webflow

1. Open your Webflow Designer
2. Drag an **Embed** element from the panel onto your canvas
3. Double-click the element to open the embed editor
4. Paste your code
5. Save & Publish

Webflow's Embed element is purpose-built for this — it works cleanly and doesn't interfere with Webflow's rendering.

---

## Wix

1. Open the Wix Editor
2. Click **+** (Add) in the left panel
3. Go to **More** → **Embed Code** → **Embed HTML**
4. An HTML embed block appears on your page
5. Click **Enter Code** in the block
6. Paste your embed code
7. Apply
8. Resize and position the block as needed

---

## Shopify

### On a Page

1. Go to **Online Store → Pages**
2. Open the page you want to edit
3. Click **<>** (Show HTML) in the editor toolbar
4. Paste your embed code in the HTML
5. Save

### On a Theme Section

1. Go to **Online Store → Themes**
2. Click **Edit code** (under Actions for your active theme)
3. Open the template file (e.g., `sections/main-page.liquid` or `templates/page.liquid`)
4. Find where you want testimonials and paste your code
5. Save

### On Every Page (Footer/Global)

1. Go to **Online Store → Themes → Edit code**
2. Open `layout/theme.liquid`
3. Find `</body>`
4. Paste your code just before `</body>`
5. Save

---

## Wix (Advanced: Velo)

If you're using Wix Velo (developer mode):

```javascript
$w.onReady(function () {
  $w('#htmlComponent').src = 'data:text/html,' + encodeURIComponent(`
    <script src="https://cdn.socialproof.dev/widget.js" 
      data-widget-id="YOUR_WIDGET_ID" async></script>
  `);
});
```

---

## Custom HTML / Static Sites

For any custom-built site:

```html
<section class="testimonials">
  <h2>What Our Customers Say</h2>
  <div id="socialproof-widget"></div>
  <script src="https://cdn.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID" async></script>
</section>
```

Drop this anywhere in your HTML. Works on static sites, GitHub Pages, Netlify, or any host.

---

## React / Next.js

```jsx
import { useEffect } from 'react';

export default function Testimonials() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.socialproof.dev/widget.js';
    script.setAttribute('data-widget-id', 'YOUR_WIDGET_ID');
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  return <div id="socialproof-widget" />;
}
```

---

## Troubleshooting

**Widget not showing up?**
- Make sure you replaced `YOUR_WIDGET_ID` with your actual ID from the dashboard
- Check browser console for JavaScript errors
- Verify the widget is set to "Published" in your SocialProof dashboard
- Make sure your approved testimonials count is > 0

**Widget looks wrong on mobile?**
- The widget is responsive by default
- If it's in a constrained container, add `width: 100%` to the parent element

**Page builder eating my code?**
- Some page builders sanitize custom HTML. Use a raw HTML/Code embed element rather than a text block.

---

The whole process — sign up, create widget, add embed — takes about 15 minutes. The hard part is actually getting testimonials in your widget, which takes a week or two of asking past customers.

→ [Start free at SocialProof](https://socialproof.dev) — no credit card required.

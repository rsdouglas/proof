# How to Add Your Testimonial Widget to Your Website

You copied your embed code from the SocialProof dashboard. Now here's exactly how to add it to your site — pick your platform below.

Your embed code looks like this:
```html
<script src="https://cdn.socialproof.dev/widget.js" data-widget-id="wgt_YOUR_ID" async></script>
```

---

## WordPress

**Method 1: Block editor (Gutenberg)**

1. Open the page or post where you want testimonials to appear
2. Click the **+** button to add a new block
3. Search for **Custom HTML** and select it
4. Paste your embed code into the Custom HTML block
5. Click **Update** to save
6. Visit your page — your testimonials should appear

**Method 2: Text widget (sidebar or footer)**

1. Go to **Appearance → Widgets** in your WordPress admin
2. Find the area where you want testimonials (sidebar, footer, etc.)
3. Add a **Custom HTML** widget
4. Paste your embed code
5. Click **Save**

**Method 3: Theme files (for developers)**

Add the embed code to your theme's `footer.php` or wherever you want it to appear. Not recommended unless you're comfortable editing PHP.

---

## Squarespace

1. Go to the page where you want testimonials
2. Click **Edit** on that page
3. Click the **+** (add block) where you want the widget
4. Scroll down and choose **Embed** or **Code** block
5. Switch to **HTML** mode (not "Display Source")
6. Paste your embed code
7. Click **Apply** and then **Save**

> **Note:** Squarespace Personal plan does not support custom code. You need the Basic Business plan or higher to add HTML/JavaScript embeds. If you see an upgrade prompt, that's why.

---

## Wix

1. In the Wix editor, click **+** to add an element
2. Go to **Embed Code → Embed a Widget**
3. Click **Enter Code** and paste your embed code
4. Resize and position the element where you want it on the page
5. Click **Publish** to make it live

> **Alternative:** Use **Wix Velo** (formerly Corvid) for more precise placement. Add the script to your site's `_corvid/public/pages/page.js` or master page code.

---

## Webflow

1. Open your project in the Webflow Designer
2. Drag an **Embed** element onto your page (found in the Elements panel under **Components**)
3. Double-click the embed element to open the code editor
4. Paste your embed code
5. Click **Save & Close**
6. Publish your site

> **Note:** If you want testimonials on every page, add the embed element to a Symbol or to your site's footer/header section.

---

## Wix Studio

Same as Wix above. Use the **Custom Code** panel under **Settings → Custom Code** to add it to every page at once (head or body).

---

## Shopify

**Method 1: Page sections (recommended)**

1. From your Shopify admin, go to **Online Store → Themes**
2. Click **Customize** on your active theme
3. Navigate to the page where you want testimonials
4. Click **Add section** and look for a **Custom HTML** or **Custom Liquid** section
5. Paste your embed code
6. Save

**Method 2: Theme editor**

1. Go to **Online Store → Themes → Edit Code**
2. Open the template file for the page you want (e.g. `templates/page.liquid`)
3. Paste your embed code where you want it to appear
4. Save

---

## Plain HTML (any website)

If you built your site by hand or use a static site generator:

1. Open the HTML file for the page where you want testimonials
2. Paste your embed code anywhere inside the `<body>` tag — ideally just before `</body>`
3. Save and upload the file

Example:
```html
<body>
  <!-- Your page content here -->

  <h2>What our customers say</h2>
  <script src="https://cdn.socialproof.dev/widget.js" data-widget-id="wgt_YOUR_ID" async></script>

</body>
```

---

## Squarespace 7.0 (older version)

1. Go to **Pages** and click on the page you want to edit
2. Click **Edit** and hover over a content block until you see **Edit** appear
3. Click the **+** to add a new block, then choose **Code**
4. Paste your embed code
5. Uncheck "Display Source" if checked
6. Click **Apply**

---

## Still stuck?

If your platform isn't listed here or you're getting a blank space where the widget should be:

1. **Check that JavaScript is enabled** — the widget requires JS to render
2. **Check your browser console** (right-click → Inspect → Console) for error messages
3. **Verify your widget ID** — the `data-widget-id` in your embed code should match what's in your dashboard
4. **Make sure you have approved testimonials** — the widget only renders if you have at least one approved testimonial

Still can't get it working? Email us at hello@socialproof.dev with a link to your page and we'll help you get it live.


# Embedding Your Widget

Proof widgets are embedded with a single script tag. Works on any website.

## The embed code

```html
<script src="https://cdn.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
```

Replace `YOUR_WIDGET_ID` with the ID from your widget settings.

## Where to place it

Paste the script tag wherever you want the widget to appear:

- **Homepage** — above the fold or in a dedicated "What customers say" section
- **Checkout page** — reduces purchase anxiety
- **Services page** — builds trust when you're asking for a decision
- **About page** — humanizes your business

You can place multiple widgets on different pages.

## Layout options

**Carousel** — A scrolling display of testimonials. Great for hero sections.
```html
<script src="https://cdn.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="carousel">
</script>
```

**Grid** — Shows 2, 3, or 4 testimonials at once.
```html
<script src="https://cdn.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="grid"
  data-columns="3">
</script>
```

**Badge** — A compact trust badge with a rating.
```html
<script src="https://cdn.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="badge">
</script>
```

## Performance

Proof widgets are served from Cloudflare's edge network. They load in under 50ms globally.
The script is async and won't block your page load.

## Shopify

In Shopify, go to **Online Store → Themes → Edit code** and find the template file for the
page where you want to add the widget. Paste the script tag where you want it to appear.

## Squarespace

In Squarespace, add a **Code block** to any page and paste the script tag inside it.

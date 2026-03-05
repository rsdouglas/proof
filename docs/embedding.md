# Embedding Your Widget

Vouch widgets are embedded with a single script tag. Works on any website.

## The embed code

```html
<script src="https://widget.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
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
<script src="https://widget.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="carousel">
</script>
```

**Grid** — Shows 2, 3, or 4 testimonials at once.
```html
<script src="https://widget.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="grid"
  data-columns="3">
</script>
```

**Badge** — A compact trust badge with a rating.
```html
<script src="https://widget.socialproof.dev/widget.js"
  data-widget-id="YOUR_ID"
  data-layout="badge">
</script>
```

## Performance

Vouch widgets are served from Cloudflare's edge network. They load in under 50ms globally.
The script is async and won't block your page load.

## Shopify

In Shopify, go to **Online Store → Themes → Edit code** and find the template file for the
page where you want to add the widget. Paste the script tag where you want it to appear.

## Squarespace

In Squarespace, add a **Code block** to any page and paste the script tag inside it.

## Rating badge (SVG)

Vouch generates a live-updating rating badge you can embed anywhere — not just your website.

**Get your badge:**
1. Go to your widget in the dashboard
2. Find "Share your rating" → click **Copy badge HTML**
3. Paste the `<img>` tag wherever you want it

```html
<img src="https://api.socialproof.dev/wall/YOUR_WIDGET_ID/badge" alt="Vouch Rating" />
```

The badge shows:
- Your star rating (e.g. ⭐⭐⭐⭐⭐)
- Average score (e.g. 4.8)
- Review count (e.g. 23 reviews)

**Where to use it:**
- Your homepage or landing page
- Email signature
- LinkedIn profile "About" section
- Proposal documents or pitch decks
- GitHub README (if you're a developer/agency)

The badge pulls live from your approved testimonials — as you collect more, it updates automatically everywhere it's embedded.

## Google star ratings (JSON-LD rich results)

Every public Vouch wall page includes built-in **JSON-LD structured data** — the technical standard that allows Google to display star ratings directly in search results.

When Google crawls your wall page (`socialproof.dev/wall/YOUR_WIDGET_ID`), it reads your review data and can show your star rating in search results.

**To get your Google star ratings:**
1. Share your wall page URL publicly (add it to your website footer, email signature, etc.)
2. Go to [Google Search Console](https://search.google.com/search-console/) → URL Inspection → submit your wall URL for indexing
3. Verify with the [Rich Results Test](https://search.google.com/test/rich-results)
4. Wait 2-4 weeks for Google to index and show stars

**Requirements:**
- At least 1 approved testimonial
- Your wall page must be publicly accessible
- Google must crawl and index the page

No code to write. No schema markup to maintain. Vouch handles all of it automatically.

See also: [How to get star ratings in Google search results →](/blog/get-star-ratings-google-search-results)

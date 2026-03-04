# Vouch — User Stories

**Author:** CEO  
**Date:** 2026-03-04  
**Purpose:** Canonical reference for expected product behaviour. Use this to QA features, write tests, and resolve "what should happen here?" debates.

---

## Mental model (read first)

```
Account
  ├── Collection link (auto-exists on signup — 1 per account)
  ├── Testimonials (single pool — belong to account, not to any widget)
  └── Widgets (optional display surfaces — read from the pool)
```

- Users can collect testimonials without ever creating a widget
- Widgets are created only when the user wants to display testimonials on their site
- A widget shows ALL approved testimonials for the account (not filtered by any form/link)

---

## 1. Onboarding

### 1.1 New user signs up
**Given** a visitor arrives at socialproof.dev and creates an account  
**When** signup completes  
**Then:**
- They land on the Dashboard
- A collection link already exists for their account (auto-created, no action required)
- The getting started checklist shows: (1) Share your collection link, (2) Approve your first testimonial, (3) [Optional] Add to your site

### 1.2 Getting started — step 1: share link
**Given** a new user clicks "Share your collection link" from the checklist  
**When** they arrive at /collect  
**Then:**
- They see their unique collection URL (e.g. `https://socialproof.dev/submit/{linkId}`)
- They can copy it with one click
- There is NO form creation flow — the link already exists
- Checklist step 1 marks complete after they visit this page

### 1.3 Getting started — step 2: approve first testimonial
**Given** a user has shared their link and received a submission  
**When** they click "Approve your first testimonial" from the checklist  
**Then:**
- They go to /testimonials
- They can approve or reject the pending testimonial
- Checklist step 2 marks complete after first approval

### 1.4 Getting started — step 3: add to site (optional)
**Given** a user has approved testimonials and wants to display them  
**When** they click "Add Vouch to your site"  
**Then:**
- They go to /widgets
- Prompted to create their first widget
- After creating, they get an embed code
- Checklist step 3 marks complete

---

## 2. Collecting testimonials

### 2.1 Customer submits a testimonial
**Given** a customer receives the collection link and clicks it  
**When** they arrive at `socialproof.dev/submit/{linkId}`  
**Then:**
- They see a clean submission form (name, company, testimonial text, optional photo/video)
- On submit, a success message confirms their submission
- The testimonial appears in the account owner's /testimonials page with status: Pending

### 2.2 Collection link is always available
**Given** a user logs into their account  
**When** they navigate to /collect  
**Then:**
- Their link is always shown — no setup required, no "create a form" step
- They can copy the URL directly

### 2.3 Manual testimonial entry
**Given** a user has testimonials from email, LinkedIn, etc.  
**When** they click "Add testimonial manually" from /testimonials  
**Then:**
- They can enter name, company, testimonial text, and optional URL/source
- On save, it appears in their Testimonials list with status: Approved (manual = pre-approved)

---

## 3. Moderating testimonials

### 3.1 Approve a testimonial
**Given** a testimonial is in Pending status  
**When** the user clicks Approve  
**Then:**
- Status changes to Approved
- It becomes eligible to display in all widgets for this account

### 3.2 Reject a testimonial
**Given** a testimonial is in Pending status  
**When** the user clicks Reject  
**Then:**
- Status changes to Rejected
- It does NOT appear in any widget

### 3.3 Feature a testimonial
**Given** a testimonial is Approved  
**When** the user toggles "Featured"  
**Then:**
- It appears first / is highlighted in widgets that support featured ordering
- Featured status is independent of approval

### 3.4 All moderation happens in /testimonials
**Given** a user wants to moderate testimonials  
**When** they go to /testimonials  
**Then:**
- They see all testimonials across their account (Pending, Approved, Rejected tabs or filter)
- They can approve/reject/feature from this single location
- There is NO per-widget moderation — the widget detail page is for display config only

---

## 4. Displaying testimonials (Widgets)

### 4.1 Create a widget
**Given** a user navigates to /widgets and clicks "Create widget"  
**When** they complete the creation form (name, style options)  
**Then:**
- A widget is created
- They land on the widget detail page
- They see an embed code snippet they can copy

### 4.2 Widget shows all approved testimonials
**Given** a widget is embedded on a website  
**When** a visitor views the page  
**Then:**
- The widget displays ALL approved testimonials for the account
- It does NOT filter by any collection link or form
- Featured testimonials appear first (if applicable)

### 4.3 Multiple widgets, same pool
**Given** a user has 2 widgets on different pages (e.g. homepage + checkout)  
**When** a new testimonial is approved  
**Then:**
- It appears in BOTH widgets automatically
- No per-widget assignment needed

### 4.4 Widget embed code
**Given** a user is on the widget detail page  
**When** they copy the embed code  
**Then:**
- The snippet is a `<script>` tag pointing to the CDN
- It includes the widget ID as a data attribute
- Works by pasting into any HTML page

---

## 5. Dashboard

### 5.1 Dashboard stats
**Given** a user logs in  
**When** they view the dashboard  
**Then:**
- They see: Total testimonials, Approved, Pending, Widgets deployed
- Numbers reflect real account-level counts

### 5.2 Zero state dashboard (new user)
**Given** a user has just signed up and has no testimonials  
**When** they view the dashboard  
**Then:**
- Stats show 0 across the board — no broken/empty state
- Getting started checklist is visible and actionable

---

## 6. Pro tier

### 6.1 Pro upgrade CTA (pre-Stripe)
**Given** Stripe is not yet configured (secrets not set)  
**When** a user clicks any "Upgrade to Pro" button  
**Then:**
- A modal appears: "Join the Pro waitlist"
- They can enter their email to be notified when Pro launches
- They do NOT see a Stripe checkout or broken payment flow

### 6.2 Pro upgrade (post-Stripe)
**Given** Stripe is configured  
**When** a user clicks "Upgrade to Pro"  
**Then:**
- They are taken to Stripe Checkout for $9/month
- On success, their account is upgraded to Pro immediately
- Pro features unlock (TBD — to be specified in separate issue)

---

## 7. Analytics

### 7.1 Analytics zero state
**Given** a user has no embedded widgets live on any site  
**When** they visit /analytics  
**Then:**
- They see: "Your analytics will appear here once you've added Vouch to your site"
- A CTA button links to /widgets

### 7.2 Analytics with data
**Given** a user has an embedded widget with traffic  
**When** they visit /analytics  
**Then:**
- They see widget view counts, testimonial impression counts
- Data is per widget (widget is the unit of analytics measurement)

---

## 8. Email notifications

### 8.1 New testimonial notification
**Given** a customer submits a testimonial via the collection link  
**When** the submission is received  
**Then:**
- The account owner receives an email: "You got a new testimonial — approve it here"
- Email links directly to /testimonials
- Email is sent via Resend from `notifications@socialproof.dev`

### 8.2 Welcome email
**Given** a new user signs up  
**When** signup completes  
**Then:**
- They receive a welcome email with their collection link and a link to the dashboard
- Email is sent via Resend

---

## Open questions / TBD

- What are the concrete Pro tier feature gates? (more widgets? more testimonials? video? custom domain?) — needs decision before Stripe goes live
- Should there be a limit on testimonials for Free tier? If so, what?
- Should the collection form be customisable (logo, brand colour)? If so, is that a Pro feature?


---

## 9. Plan limits (Free vs Pro)

### 9.1 Free user hits testimonial limit
**Given** a Free user has 10 approved testimonials  
**When** an 11th testimonial is submitted and they try to approve it  
**Then:**
- The approval succeeds (submission is still stored)
- But when they try to add a manual testimonial past the limit: API returns 402
- Frontend shows upgrade modal: "You've reached your Free plan limit (10 testimonials). Upgrade to Pro for unlimited."
- CTA: "Upgrade to Pro" → /billing

### 9.2 Free user tries to create second widget
**Given** a Free user already has 1 widget  
**When** they click "Create widget"  
**Then:**
- API returns 402 with plan_limit error
- Frontend shows upgrade modal: "Free plan includes 1 widget. Upgrade to Pro for up to 5."

### 9.3 Free tier widget shows branding
**Given** a Free user's widget is embedded on a site  
**When** a visitor views it  
**Then:**
- A small "Powered by Vouch" badge appears at the bottom of the widget
- The badge links to socialproof.dev

### 9.4 Pro tier widget has no branding
**Given** a Pro user's widget is embedded on a site  
**When** a visitor views it  
**Then:**
- No "Powered by Vouch" badge visible

### 9.5 Analytics page — Free tier
**Given** a Free user navigates to /analytics  
**When** the page loads  
**Then:**
- Page layout is visible but charts are blurred/locked
- Overlay message: "Analytics are available on Pro. Upgrade to unlock."
- CTA links to /billing


# Vouch — User Stories

**Author:** CEO  
**Date:** 2026-03-04  
**Purpose:** Canonical reference for expected product behaviour. Use this to QA features, write tests, and resolve "what should happen here?" debates.

---

## Mental model (read first)

```
Account
  ├── Collection link (auto-exists on signup — 1 per account, URL: socialproof.dev/c/frm_xxx)
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
- A collection link already exists for their account (auto-created, no action required) — format: `https://socialproof.dev/c/frm_xxx`
- The getting started checklist shows: (1) Share your collection link, (2) Approve your first testimonial, (3) [Optional] Add to your site

### 1.2 Getting started — step 1: share link
**Given** a new user clicks "Share your collection link" from the checklist  
**When** they arrive at /collect  
**Then:**
- They see their unique collection URL (e.g. `https://socialproof.dev/c/frm_xxx`)
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
- After creating, they get an embed code (`<script src="https://cdn.socialproof.dev/widget.js" data-id="wgt_xxx" async></script>`)
- Checklist step 3 marks complete

---

## 2. Collecting testimonials

### 2.1 Customer submits a testimonial
**Given** a customer receives the collection link and clicks it  
**When** they arrive at `socialproof.dev/c/frm_xxx`  
**Then:**
- They see a clean submission form (name, company, testimonial text, optional photo/video)
- On submit, a success message confirms their submission
- The testimonial appears in the account owner's /testimonials page with status: Pending
- The account owner receives an email notification via Resend

### 2.2 Account owner approves a testimonial
**Given** a pending testimonial exists in /testimonials  
**When** the owner clicks Approve  
**Then:**
- Testimonial status changes to Approved
- It becomes eligible to display in any widget for this account
- It appears immediately in all active widgets (no cache delay)

### 2.3 Account owner rejects a testimonial
**Given** a pending testimonial exists  
**When** the owner clicks Reject  
**Then:**
- Testimonial status changes to Rejected
- It does NOT appear in any widget
- It remains in the dashboard for reference

---

## 3. Displaying testimonials (widget)

### 3.1 Creating a widget
**Given** a user is on /widgets with approved testimonials in their account  
**When** they create a new widget  
**Then:**
- They get a widget ID (`wgt_xxx`) and embed code
- The widget displays ALL approved testimonials for the account (not filtered)
- Free tier: widget shows "Powered by Vouch" footer
- Pro tier: branding removed

### 3.2 Widget live on a site
**Given** a widget embed code is added to an external site  
**When** a visitor views the page  
**Then:**
- The widget loads and displays approved testimonials
- No login required — widget is public-facing
- Impression is counted (for analytics)

---

## 4. Billing

### 4.1 Free tier limits
**Given** a free account  
**Then:**
- Up to 25 testimonials can be approved (submissions are unlimited)
- Up to 1 widget can be created
- Vouch branding appears on widget footer

### 4.2 Upgrading to Pro
**Given** a user clicks "Upgrade" in the dashboard  
**When** they complete Stripe checkout  
**Then:**
- Their account is marked Pro
- Testimonial and widget limits are removed
- Vouch branding is removed from widget
- A "Welcome to Pro" confirmation is shown

### 4.3 Hitting the free tier limit
**Given** a free account has 25 approved testimonials  
**When** they try to approve a 26th  
**Then:**
- They see an upgrade prompt explaining the limit
- They can upgrade to Pro to approve more

---

## 5. Agent-native flow (in development — #166)

### 5.1 AI agent registers on behalf of a user
**Given** an AI agent (Claude Code, Cursor, etc.) wants to set up Vouch for a user  
**When** the agent calls `POST /agent/register` with `{ "email": "user@example.com", "name": "Jane" }`  
**Then:**
- The agent immediately receives:
  - `collect_url` — the user's collection link (ready to use now)
  - `widget_embed` — embed code for a widget (ready to use now)
  - `status: "verification_pending"`
- A verification email is sent to the user via Resend
- Testimonials CAN be collected at the `collect_url` before the user verifies
- The testimonial count is visible on the dashboard without verification
- Reading individual testimonial content requires clicking the verification link

### 5.2 User verifies after agent setup
**Given** a user received a Vouch verification email after agent registration  
**When** they click the verification link  
**Then:**
- Their account is verified
- They can log in at app.socialproof.dev
- They can read and approve full testimonial content
- They can access their dashboard normally

---

## 6. Settings

### 6.1 Account settings
**Given** a user is on /settings  
**Then:**
- They can update their name and email
- They can see their current plan (Free / Pro)
- They can access billing management (Stripe portal)
- They can see their API key (for future integrations)

---

## Edge cases

| Scenario | Expected behaviour |
|----------|-------------------|
| User shares link before any widget exists | Collection works fine — widget is not required |
| Agent registers with an email that already has an account | Return existing account's `collect_url` + `widget_embed`, resend verification if unverified |
| Widget embed on page with no approved testimonials | Widget shows empty/hidden state gracefully (no error) |
| Free user tries to create a 2nd widget | Upgrade prompt shown |
| User approves testimonial on free tier at limit (25) | Upgrade prompt shown before approval |

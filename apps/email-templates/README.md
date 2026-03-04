# Vouch Email Templates

Drip sequence for new user registrations. Triggered by `user_created` event.

## Sequence

| File | Timing | Subject |
|------|--------|---------|
| `drip-01-welcome.html` | T+0 (immediate) | Your Vouch widget is ready — here's how to activate it |
| `drip-02-first-testimonial.html` | T+48h | One testimonial can increase conversions by 34% |
| `drip-03-upgrade-nudge.html` | T+7d (skip if user.plan === 'pro') | You've been on Free for a week. Here's what's next. |

## Trigger

**Event:** `user_created`  
**Provider:** Resend  
**From:** hello@socialproof.dev  

## Template Variables

- `{{first_name}}` — user's first name (fall back to "there" if null)
- `{{widget_id}}` — ID of the user's first auto-created widget
- `{{collect_url}}` — unique collection form URL (e.g. socialproof.dev/c/wgt_xxx)
- `{{dashboard_url}}` — https://app.socialproof.dev/dashboard
- `{{upgrade_url}}` — https://app.socialproof.dev/upgrade
- `{{unsubscribe_url}}` — one-click unsubscribe URL (required for CAN-SPAM)

## Notes

- Email 3 should be skipped if `user.plan === 'pro'` at send time
- All emails use Vouch brand colors (#1a1a1a primary, #f8f8f5 background)
- Plain-text versions should be generated from HTML at send time via Resend
- See GitHub issue #178 for full dev spec

# Vouch Email Templates

Drip sequence for new user registrations. Triggered by `user_created` event.

## Sequence

| File | Timing | Trigger condition | Subject |
|------|--------|-------------------|---------|
| `drip-01-welcome.html` | T+0 (immediate) | All new users | Your Vouch widget is ready — here's how to activate it |
| `drip-02-first-testimonial.html` | T+48h | All new users | One testimonial can increase conversions by 34% |
| `drip-04-no-testimonials-nudge.html` | T+4d | `testimonial_count === 0` | You haven't sent your collection link yet |
| `drip-03-upgrade-nudge.html` | T+7d | `user.plan === 'free'` | You've been on Free for a week. Here's what's next. |
| `drip-05-winback.html` | T+14d | `testimonial_count === 0` | Two weeks ago you signed up. Just checking in. |

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

## Conditional logic

- Email 3 (upgrade nudge) should only send if `user.plan === 'free'` at send time
- Email 4 (no-testimonials nudge) should only send if `testimonial_count === 0` at T+4d
- Email 5 (win-back) should only send if `testimonial_count === 0` at T+14d — stop after this

## Notes

- All emails use Vouch brand colors (#1a1a1a primary, #f8f8f5 background)
- Plain-text versions generated from HTML at send time via Resend
- CAN-SPAM: unsubscribe link required in all emails
- See GitHub issue #178 for full dev spec (Email 4 + 5 new — needs dev implementation)

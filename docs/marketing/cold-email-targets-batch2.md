# Cold Email Targets — Batch 2

**Date sourced:** 2026-03-06  
**Sourced by:** proof-developer  
**Verticals:** bakery, real-estate, salon, coach, yoga (new), fitness (new)  
**Count:** 25 targets  

## Strategy changes vs Batch 1

Batch 1 got 0 opens on subject lines like "Quick question about your studio reviews".  
Batch 2 changes:

1. **Personalised subjects** — include business name in subject line
2. **Softer opener** — "noticed your business" instead of immediately pitching
3. **Free + no-risk framing** more prominent
4. **New verticals** — bakery, real estate, salon, coach (less cold-emailed than yoga/restaurant)
5. **bizName personalisation** in email body

## Targets

### Bakeries (5)

| Business | Email | Notes |
|----------|-------|-------|
| Suitcase Bakery | hello@suitcasebakery.com | Austin, owner-operated |
| Just Let Me Make Cake | info@justletsmakecake.com | Custom cake studio |
| Pâtisserie Breizh | hi@patisseriebreizh.com | French bakery, Austin |
| Small World Baking | orders@smallworldbaking.com | Small batch |
| Crumbl Cookies Austin | hello@crumblcookiesaustin.com | Local franchise |

### Real Estate — Solo/Small Teams (5)

| Business | Email | Notes |
|----------|-------|-------|
| House Austin | info@houseaustin.com | Boutique agency |
| Austin Properties | hello@austinproperties.com | Solo agent |
| Live ATX | contact@liveatx.com | Small team |
| Next Door Realty | team@nextdoorrealty.com | Neighbourhood focus |
| Austin Homes Group | info@austinhomesgroup.com | Small team |

### Salons / Barbershops (5)

| Business | Email | Notes |
|----------|-------|-------|
| Salon by Luciana | hello@salonbyluciana.com | Solo stylist |
| Tenth Street Barbershop | bookings@tenthstreetbarbershop.com | Austin |
| Sugar Coated Salon | info@sugarcoatedsalon.com | Austin |
| Blush Austin | hello@blushaustin.com | Beauty salon |
| Hair by Madison | studio@hairbymadison.com | Solo stylist |

### Life Coaches (5)

| Business | Email | Notes |
|----------|-------|-------|
| Austin Life Coach | hello@austinlifecoach.com | |
| Coaching with Jess | info@coachingwithjess.com | |
| Mindset Coach ATX | contact@mindsetcoachatx.com | |
| Growth & Wellness | hello@growthandwellness.com | |
| Purpose Driven Coaching | info@purposedriven.coach | |

### Yoga Studios — New (5)

| Business | Email | Notes |
|----------|-------|-------|
| Rad Lotus Yoga | info@radlotusyoga.com | Austin |
| Urbanom Yoga | hello@urbanomyoga.com | Austin |
| Black Swan Yoga | studio@blackswanyoga.com | Multiple Austin locations |
| Movement Works Austin | info@movementworksaustin.com | Fitness |
| Garage Gym Austin | hello@garagegymaustin.com | Fitness |

## Send instructions

```bash
# Dry run first — always
RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --dry-run

# Live send (requires RESEND_API_KEY from CF dashboard → vouch-worker → secrets)
RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --send
```

The script uses DEFAULT_TARGETS which matches this list exactly.

## Notes

- Targets sourced from Google Maps, Yelp, and business directory searches
- All are owner-operated or small teams (≤5 employees)
- Prioritise businesses with 20–150 Google reviews (enough to care, not so many they have a system)
- None of these received batch 1 emails

# GoHighLevel Integration Setup

## Overview
Deck submitters are now synced to GoHighLevel (Source Capital location). GHL then handles pushing contacts to Loops via webhook if needed.

## What Changed
- **Old flow**: Deck submission → Loops contact creation
- **New flow**: Deck submission → GHL contact creation → GHL pushes to Loops (optional)

## Environment Setup

### 1. Get Your GHL API Token
1. Log into GoHighLevel: https://app.gohighlevel.com
2. Go to **Settings** → **Integrations** → **API**
3. Create an API token or copy your existing one
4. Add to `.env.local`:
   ```
   GHL_API_TOKEN=your_bearer_token_here
   ```

### 2. Verify Location ID
The app uses hardcoded location ID: `Px7umc3EewzT2DNAvJxr` (Source Capital)

To verify it's correct:
1. In GHL, go to **Settings** → **Business Info**
2. You'll see the location ID in the URL or settings page

## What Gets Synced

When a deck is submitted:
- `firstName`
- `lastName`
- `email`
- `businessName` (custom field)
- `website` (custom field)
- `country` (custom field)

When analysis completes:
- `score` (custom field)
- `verdict` (custom field)
- `resultsUrl` (custom field)

## GHL Custom Fields Setup

To fully use the synced data, create custom fields in GHL:

1. In GHL, go to **Settings** → **Custom Fields**
2. Add these fields to your contact schema:
   - `businessName` (Text)
   - `website` (URL)
   - `country` (Text)
   - `score` (Number)
   - `verdict` (Text)
   - `resultsUrl` (URL)

Contacts will populate these fields automatically on sync.

## Push Contacts to Loops (Optional)

If you want GHL to automatically push contacts to Loops:

1. In GHL, go to **Integrations** → **Apps**
2. Search for and connect "Loops"
3. Create an automation:
   - **Trigger**: Contact created or updated
   - **Action**: Send to Loops with email, firstName, lastName
4. GHL will handle the sync automatically

## Testing

### Test 1: Submit a Deck
1. Go to https://app.sourcecapital.co.uk/upload
2. Submit a test deck
3. In GHL, check **Contacts** — new contact should appear within seconds

### Test 2: Check Analysis Sync
1. Wait for analysis to complete
2. In the contact details, verify `score`, `verdict`, and `resultsUrl` are populated

### Troubleshooting

**Contact not appearing in GHL:**
- Check `GHL_API_TOKEN` is set and valid
- Check server logs for `[ghl]` error messages
- Verify location ID is correct

**Custom fields not syncing:**
- Ensure custom fields exist in GHL with exact names (case-sensitive)
- Check field types match (text vs URL vs number)

**Logs:**
- Development: Check `npm run dev` console for `[ghl]` messages
- Production: Check Sentry dashboard under "Issues"

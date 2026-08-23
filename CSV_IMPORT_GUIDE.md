# CSV Investor Import Guide

## Overview
You can now bulk import investors into a Raise Project using a CSV file. This is faster than adding investors one by one when you have a large list.

## How to Use

1. **Navigate to a Project**: Go to `/crm/projects` and open any project you own or have edit access to
2. **Click "📁 Import CSV"**: Located next to the "+ Add Investor" button in the project header
3. **Select CSV File**: Choose your CSV file from your computer
4. **Preview**: Review the preview of the first few rows to ensure they look correct
5. **Import**: Click "Import Investors" to add all investors to the pipeline

## CSV Format

### Required Columns
- **fund_name** — The name of the fund or organization (required, cannot be empty)

### Optional Columns
- **contact_name** — Name of the specific contact person at the fund
- **role** — Job title/role (e.g., "Partner", "Associate", "Investor")
- **email** — Contact email address
- **linkedin_url** — LinkedIn profile URL
- **stage_focus** — Stages the investor focuses on (comma-separated: "Seed,Series A,Series B")
- **geography** — Geographic focus areas (comma-separated: "US,EU,APAC")
- **sector_focus** — Sector interests (comma-separated: "SaaS,FinTech,AI")
- **check_size_min** — Minimum check size in dollars (numeric only)
- **check_size_max** — Maximum check size in dollars (numeric only)
- **thesis_notes** — Investment thesis or notes

### Example CSV

```csv
fund_name,contact_name,role,email,linkedin_url,stage_focus,geography,sector_focus,check_size_min,check_size_max,thesis_notes
Accel Partners,Jane Smith,Partner,jane@accel.com,https://linkedin.com/in/jane-smith,Seed;Series A,US;EU,SaaS;FinTech,100000,1000000,Early-stage B2B software
Sequoia Capital,John Chen,Investor,john@sequoia.com,https://linkedin.com/in/john-chen,Series A;Series B,US,AI;ML,500000,5000000,Focusing on AI infrastructure
```

### Tips

1. **Column Headers**: Use lowercase headers to ensure proper matching. Underscores and spaces are both supported:
   - ✅ `fund_name` or `fund name`
   - ✅ `linkedin_url` or `linkedin url`
   - ✅ `check_size_min` or `check size min`

2. **Stage Focus**: Use semicolon (`;`) to separate multiple stages:
   - `Seed;Series A;Series B`

3. **Geography**: Use semicolon (`;`) to separate multiple regions:
   - `US;EU;APAC`

4. **Sector Focus**: Use semicolon (`;`) to separate sectors:
   - `SaaS;FinTech;B2B`

5. **Numbers**: For check sizes, use numeric values only (no commas or currency symbols):
   - ✅ `100000`
   - ❌ `$100,000`

6. **Empty Cells**: Leave optional fields blank or empty—no need to fill every column

## What Happens After Import

- All imported investors are added to the **"researching"** stage by default
- They appear immediately in the project's Pipeline tab
- Email and LinkedIn data is preserved for follow-up
- You can edit individual investor details by clicking on them in the pipeline

## Troubleshooting

### "CSV validation failed" Error
- Check that you have at least one row with a valid `fund_name` value
- Ensure at least 2 rows: header + 1 data row

### Only the First 5 Rows Show in Preview
- The preview shows only the first 5 rows to keep the UI responsive
- All rows in your CSV will be imported when you click "Import Investors"

### Investors Not Appearing
- Refresh the page after import completes
- Check the project's Pipeline tab—they should be at the top of the list

## Download Template

A sample CSV file is available at `/sample-investors.csv` to use as a starting template.
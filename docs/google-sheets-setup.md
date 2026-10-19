# Google Sheets setup (csv-formatter)

The csv-formatter appends rows to one fixed Google Sheet using a Google service account. Redo this when you rotate the key, move to a new sheet, or set up a new environment.

Time: about 45 minutes the first time, 10 minutes for a key rotation.

## Env vars

| Name | Value |
| --- | --- |
| `GOOGLE_SHEET_ID` | The ID in the sheet URL, between `/d/` and `/edit` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The whole service account key JSON, on one line |
| `GOOGLE_SHEET_ALLOWED_TABS` | Optional. Comma-separated exact tab names the dropdown may show and append to, for example `Jan,Feb,Joint Account`. Unset or blank allows all tabs. Names containing a comma can't be listed. |

Env changes on Vercel only apply after a redeploy.

## A. Google Cloud

1. Create a project at https://console.cloud.google.com/projectcreate (for example `finance-tools`).
2. With that project selected, enable the API at https://console.cloud.google.com/apis/library/sheets.googleapis.com. Click **Enable**.
3. Open https://console.cloud.google.com/iam-admin/serviceaccounts. Click **Create service account**, name it `sheet-writer`, skip the optional role steps, and click **Done**.
4. Open the account, go to **Keys**, then **Add key**, **Create new key**, **JSON**. The key file downloads. Treat it as a password and never commit it.
5. Copy `client_email` from the file. It ends in `.iam.gserviceaccount.com`.
6. Open the target sheet, click **Share**, paste that email, set the role to **Editor**, untick notify, and share.
7. Copy the sheet ID from the sheet URL.

## B. Local

8. Collapse the key to one line:
   ```bash
   node -e "console.log(JSON.stringify(require('./path/to/key.json')))"
   ```
9. Create `.env.local` in the repo root. Put the one-line JSON inside single quotes:
   ```
   GOOGLE_SHEET_ID=<sheet id>
   GOOGLE_SERVICE_ACCOUNT_JSON='<one-line json>'
   ```
10. Run `npm run dev`, open `/csv-formatter`, and upload a small file. The last step should list the sheet's tabs.

## C. Vercel

11. In the project, go to **Settings**, then **Environment Variables**. Add both vars for Production. Paste the JSON without the surrounding single quotes.
12. Redeploy.

## D. Live checks

Use a scratch tab, or delete the test rows afterwards.

- **Columns:** a row lands as Date, blank, Description, blank, Amount.
- **Date:** the cell is a real date (right-aligned) with day and month the right way round. Test `25/12/2024` and `03/04/2024`. Parsing depends on the sheet's locale, not only its display format. If it fails, reopen `.scratch/csv-to-google-sheet/issues/02-written-row-shape.md` rather than patching around it.
- **Formula text:** a description starting with `=`, `+`, `-` or `@` shows as text, with no visible leading `'`.
- **Apostrophe in a tab name:** try a tab called `Bob's tab`. Record whether it works.
- **Deployed build:** repeat the column check on the Vercel URL to confirm the one-line key works there.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "No access" error | The sheet isn't shared with the service account email (step 6) |
| "Not configured" error | An env var is missing or the JSON is broken. Restart `npm run dev` after editing `.env.local` |
| Tab dropdown stays empty | The Sheets API isn't enabled in the same project as the key (step 2) |
| Works locally, fails on Vercel | Vars not set for Production, or no redeploy since setting them |
| Rate-limited message | Google allows about 60 writes per user per minute. Wait and retry |

## Key rotation

1. Create a new key (step 4).
2. Update `GOOGLE_SERVICE_ACCOUNT_JSON` locally and on Vercel, then redeploy.
3. Delete the old key under the service account's **Keys** tab.

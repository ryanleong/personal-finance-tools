# Context

## Glossary

- **Formatted row**: one normalised transaction (date, description, amount) produced by the csv-formatter.
- **Target spreadsheet**: the single, fixed Google Sheet that formatted rows are appended to. Not chosen per run.
- **Target tab**: the existing tab within the target spreadsheet that the user picks for a run.
- **Occurrence number**: the position of a formatted row among identical rows (same date, description, amount) in one uploaded file, counted from 1. Lets two genuine identical transactions on one day stay distinct.
- **Fingerprint**: the identifier of a formatted row, derived from its date, description, amount and occurrence number. Stored alongside the row in the target tab so later imports can recognise it.
- **Duplicate**: a formatted row whose fingerprint already exists in the target tab. Shown in the preview, unselected by default, and only appended if the user overrides.

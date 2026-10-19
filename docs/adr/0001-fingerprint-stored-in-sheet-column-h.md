# Store each row's fingerprint in the target tab (column H)

Bank statements overlap and carry no transaction IDs, so re-importing the same period would append duplicates. We give every **Fingerprint** (date, description, amount, **occurrence number**) a SHA-256 truncated to 16 hex characters, append it to column H of the **Target tab**, and read column H on the next import to flag **Duplicates**.

## Considered options

- **Compare against sheet cells (A, C, E).** Needs no new column, but breaks as soon as a description is edited, and date/amount formats shift when Sheets re-renders them.
- **Separate store of past imports** (database, file, hidden tab). Adds infrastructure and drifts out of sync when rows are deleted from the sheet.
- **Fingerprint in the sheet (chosen).** The sheet stays the single source of truth, deleted rows stop counting, and edits to other columns don't matter. The cost is a visible helper column and rows written 8 columns wide (F and G left blank).

## Consequences

- The **occurrence number** keeps two genuine identical transactions on one day distinct.
- Rows imported before this change have no fingerprint; one is computed on read from A, C and E. Edited legacy rows may not match and show as new in the preview.
- Reading column H scales with tab size (about 3,000 rows today, one API call).

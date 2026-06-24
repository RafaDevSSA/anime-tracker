#!/usr/bin/env bash
# Marks a board item as Done after its PR has been merged.
# Usage: scripts/close-task.sh <issue-number>
set -euo pipefail

OWNER="RafaDevSSA"
PROJECT_NUMBER=1
PROJECT_ID="PVT_kwHOA7Hqc84BZ0PD"
STATUS_FIELD_ID="PVTSSF_lAHOA7Hqc84BZ0PDzhUwSkc"
DONE_OPTION_ID="98236657"

issue_number="${1:?usage: close-task.sh <issue-number>}"

item_id=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
  | node -e "
const data = JSON.parse(require('fs').readFileSync(0));
const item = data.items.find(i => i.content && i.content.number === Number(process.argv[1]));
if (!item) process.exit(1);
console.log(item.id);
" "$issue_number")

gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$DONE_OPTION_ID"

echo "Issue #${issue_number} marked as Done."

#!/usr/bin/env bash
# Picks the highest-priority "Todo" item from the AnimeTracker board,
# moves it to "In Progress", and prints branch name + issue body.
set -euo pipefail

OWNER="RafaDevSSA"
PROJECT_NUMBER=1
PROJECT_ID="PVT_kwHOA7Hqc84BZ0PD"
STATUS_FIELD_ID="PVTSSF_lAHOA7Hqc84BZ0PDzhUwSkc"
IN_PROGRESS_OPTION_ID="47fc9ee4"

items_json=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)

next=$(node -e "
const data = $items_json;
const order = { '🔴 High': 0, '🟡 Medium': 1, '🟢 Low': 2 };
const todo = data.items.filter(i => i.status === 'Todo' && i.content && i.content.number);
todo.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
if (todo.length === 0) { process.exit(1); }
console.log(JSON.stringify(todo[0]));
")

if [ -z "$next" ]; then
  echo "No Todo items found." >&2
  exit 1
fi

item_id=$(echo "$next" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).id)")
issue_number=$(echo "$next" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).content.number)")
title=$(echo "$next" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).title)")

slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[a-z]+: //; s/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-40)
branch="task/${issue_number}-${slug}"

gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$IN_PROGRESS_OPTION_ID" >/dev/null

echo "Issue:  #${issue_number} — ${title}"
echo "Branch: ${branch}"
echo
gh issue view "$issue_number" --repo "${OWNER}/anime-tracker" --json title,body,url \
  --jq '"\(.title)\n\(.url)\n\n\(.body)"'
echo
echo "git checkout -b ${branch}"

#!/usr/bin/env bash
# מעתיק את משתני הסביבה מ-.env.local ל-Vercel (production + preview) בלי להדפיס ערכים.
# שימוש: מתוך app/  ./scripts/vercel-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.local ] || { echo ".env.local חסר"; exit 1; }
for target in production preview; do
  while IFS= read -r line; do
    [[ "$line" =~ ^([A-Z0-9_]+)=(.*)$ ]] || continue
    name="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
    [[ "$name" == VERCEL_* ]] && continue      # vercel link מוסיף VERCEL_OIDC_TOKEN מקומי — לא מעלים
    value="${value%%[[:space:]]#*}"            # מסיר הערות בסוף שורה
    value="$(printf '%s' "$value" | sed -e "s/^['\"]//" -e "s/['\"]$//")"
    printf '%s' "$value" | vercel env add "$name" "$target" --force >/dev/null 2>&1 && echo "  $target  $name  ok" || echo "  $target  $name  FAILED"
  done < .env.local
done

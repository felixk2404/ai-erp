# נטען עם source מתוך תיקיית n8n. טוען .env ומנקה תווים נסתרים שעורכי טקסט מכניסים
# (סימני כיווניות RTL/LTR, רווחים ברוחב אפס, גרשיים חכמים), ומנרמל SUPABASE_URL.
set -a
source .env
set +a
while IFS= read -r name; do
  [ -z "$name" ] && continue
  val="${!name-}"
  clean=$(printf '%s' "$val" | perl -CS -pe 's/[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2066}-\x{2069}\x{FEFF}]//g; s/[\x{2018}\x{2019}\x{201C}\x{201D}]//g; s/^\s+|\s+$//g')
  [ "$clean" != "$val" ] && export "$name=$clean"
done < <(grep -oE '^[A-Z_][A-Z0-9_]*=' .env | tr -d '=')
export SUPABASE_URL="${SUPABASE_URL%%/rest/v1*}"
export SUPABASE_URL="${SUPABASE_URL%/}"

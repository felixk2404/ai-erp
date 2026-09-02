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
# מקודד את הסיסמה בתוך SUPABASE_DB_URL (תווים כמו # @ / ? חייבים percent-encoding)
if [[ "${SUPABASE_DB_URL:-}" == postgres*://*:*@* ]]; then
  export SUPABASE_DB_URL=$(printf '%s' "$SUPABASE_DB_URL" | python3 -c '
import sys, urllib.parse
u = sys.stdin.read()
scheme, rest = u.split("://", 1)
userinfo, hostpart = rest.rsplit("@", 1)
user, pw = userinfo.split(":", 1)
pw = urllib.parse.quote(urllib.parse.unquote(pw), safe="")
print(scheme + "://" + user + ":" + pw + "@" + hostpart, end="")')
fi

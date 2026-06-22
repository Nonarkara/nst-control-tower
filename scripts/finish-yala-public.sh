#!/usr/bin/env bash
#
# finish-yala-public.sh — the last mile: put the Yala stack on its public domains.
#
# This is intentionally a script you run by hand (one time). It publicly exposes
# the local Mac API and creates DNS, which an AI agent should not do unattended —
# so review it, then run it yourself:
#
#     bash scripts/finish-yala-public.sh
#
# It uses a DEDICATED Cloudflare tunnel ("yala") with its own config + launchd
# job, so it never touches the shared ~/.cloudflared/config.yml that routes the
# Chula/Chonburi/etc. dashboards.
#
# Prereqs (already true on this Mac):
#   • cloudflared installed + ~/.cloudflared/cert.pem present (origin cert)
#   • the yala-api Node daemon running on 127.0.0.1:8789 (org.nonarkara.yala-api)
#   • Cloudflare account 74ad6bf8dfaaccf82de6f0847f7d2d54 / zone nonarkara.org
set -euo pipefail

CF=~/.cloudflared
LA=~/Library/LaunchAgents
WEB_ORIGIN="https://yala-control-tower.pages.dev"   # Pages site the web domain proxies to

echo "==> 1/5  Create the dedicated 'yala' tunnel (isolated from the shared tunnel)"
if ! cloudflared tunnel list 2>/dev/null | grep -q '\byala\b'; then
  cloudflared tunnel create yala
fi
YALA_UUID=$(cloudflared tunnel list 2>/dev/null | awk '$2=="yala"{print $1}')
echo "    yala tunnel UUID: ${YALA_UUID}"

echo "==> 2/5  Write ${CF}/yala.yml"
cat > "${CF}/yala.yml" <<YAML
tunnel: ${YALA_UUID}
credentials-file: ${CF}/${YALA_UUID}.json
no-autoupdate: true

ingress:
  # The Node API (Atlas, Knowledge Platform, live archive)
  - hostname: yala-api.nonarkara.org
    service: http://localhost:8789
  # The dashboard web app — proxy the deployed Pages site so the Mac serves it
  # at the vanity domain. (Alternatively, set yala.nonarkara.org up as a Pages
  # custom domain in the Cloudflare dashboard and delete this rule.)
  - hostname: yala.nonarkara.org
    service: ${WEB_ORIGIN}
    originRequest:
      httpHostHeader: yala-control-tower.pages.dev
  - service: http_status:404
YAML

echo "==> 3/5  Route DNS (proxied CNAMEs to the yala tunnel)"
cloudflared tunnel route dns yala yala-api.nonarkara.org
cloudflared tunnel route dns yala yala.nonarkara.org

echo "==> 4/5  Install + load the tunnel launchd job"
cat > "${LA}/org.nonarkara.yala-tunnel.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>org.nonarkara.yala-tunnel</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/caffeinate</string><string>-is</string>
    <string>/opt/homebrew/bin/cloudflared</string><string>tunnel</string>
    <string>--config</string><string>${CF}/yala.yml</string><string>run</string><string>yala</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>${CF}/yala-tunnel.out.log</string>
  <key>StandardErrorPath</key><string>${CF}/yala-tunnel.err.log</string>
</dict></plist>
PLIST
launchctl bootout "gui/$(id -u)/org.nonarkara.yala-tunnel" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "${LA}/org.nonarkara.yala-tunnel.plist"

echo "==> 5/5  Verify"
sleep 6
echo -n "    yala-api.nonarkara.org : "; curl -s -o /dev/null -w "%{http_code}\n" https://yala-api.nonarkara.org/api/health || true
echo -n "    yala.nonarkara.org     : "; curl -s -o /dev/null -w "%{http_code}\n" https://yala.nonarkara.org/ || true

cat <<'NOTE'

Done. If the domains 404 for a minute, DNS is still propagating — retry.

Optional final touch — point the deployed dashboard's live time-machine at the
Mac so the public Archive tab shows accumulating history:
  • edit apps/web/src/lib/apiBase.ts → add  export const ARCHIVE_BASE = "https://yala-api.nonarkara.org";
  • in PlatformView.tsx ArchiveTab, fetch `${ARCHIVE_BASE}/api/archive`
  • pnpm --filter @yala/web build && wrangler pages deploy dist --project-name yala-control-tower
(Everything else already works off the Worker, so this is purely to surface live history.)
NOTE

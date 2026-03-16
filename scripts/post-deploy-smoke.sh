#!/usr/bin/env bash
set -euo pipefail

check() {
  local url="$1" expect="$2" label="$3"
  local body
  body=$(mktemp)
  local code
  code=$(curl -sS -o "$body" -w '%{http_code}' -L "$url")
  if [ "$code" != "$expect" ]; then
    echo "FAIL [$label] $url expected $expect got $code" >&2
    head -n 20 "$body" >&2 || true
    rm -f "$body"
    return 1
  fi
  rm -f "$body"
  echo "OK   [$label] $url -> $code"
}

check_prefix() {
  local url="$1" prefix="$2" label="$3"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' "$url")
  case "$code" in
    ${prefix}*) echo "OK   [$label] $url -> $code" ;;
    *) echo "FAIL [$label] $url expected ${prefix}xx got $code" >&2; return 1 ;;
  esac
}

check 'https://socialproof.dev/' 200 'marketing-home'
check 'https://socialproof.dev/for/plumbers/' 200 'marketing-route'
check 'https://socialproof.dev/vs/boast/' 200 'comparison-route'
check 'https://app.socialproof.dev/' 200 'dashboard-home'
check 'https://widget.socialproof.dev/v1/socialproof.js' 200 'widget-asset'
check 'https://api.socialproof.dev/health' 200 'worker-health'
check_prefix 'https://api.socialproof.dev/api/admin/stats' 4 'admin-auth-gate'


warn_if_contains() {
  local url="$1" needle="$2" label="$3" message="$4"
  local body
  body=$(mktemp)
  curl -sS -L "$url" > "$body"
  if grep -Fq "$needle" "$body"; then
    echo "WARN [$label] $message" >&2
  else
    echo "OK   [$label] $message"
  fi
  rm -f "$body"
}

warn_if_contains 'https://socialproof.dev/' 'Sarah K.' 'marketing-mode' 'homepage still shows static fallback testimonial cards'

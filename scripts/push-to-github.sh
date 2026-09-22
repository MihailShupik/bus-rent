#!/usr/bin/env bash
#
# Одной командой создаёт репозиторий на GitHub и заливает туда проект.
#
# GitHub больше не принимает пароли — нужен Personal Access Token (PAT):
#   github.com → Settings → Developer settings → Personal access tokens →
#   Tokens (classic) → Generate new token (classic) → scope: repo → Generate.
#
# Использование:
#   GITHUB_TOKEN=ghp_xxxxxxxx ./scripts/push-to-github.sh [имя-репозитория]
#
set -euo pipefail

REPO="${1:-bus-rent}"
TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Ошибка: не задан GITHUB_TOKEN."
  echo "Пример: GITHUB_TOKEN=ghp_xxx ./scripts/push-to-github.sh bus-rent"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "→ Проверяю токен..."
USER_JSON="$(curl -sf -H "Authorization: Bearer $TOKEN" https://api.github.com/user)" \
  || { echo "Ошибка: токен недействителен или истёк."; exit 1; }
OWNER="$(printf '%s' "$USER_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["login"])')"
echo "  аккаунт: $OWNER"

echo "→ Создаю репозиторий $OWNER/$REPO (если ещё нет)..."
CODE="$(curl -s -o /tmp/gh_create_repo.json -w '%{http_code}' \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO\",\"description\":\"Landing page for bus rental + admin panel (Next.js + PostgreSQL)\",\"private\":false,\"has_issues\":true,\"has_wiki\":false}")"

case "$CODE" in
  201) echo "  репозиторий создан" ;;
  422) echo "  репозиторий уже существует — продолжаю" ;;
  *)   echo "  ошибка API GitHub ($CODE):"; cat /tmp/gh_create_repo.json; exit 1 ;;
esac

echo "→ Загружаю проект (ветка main)..."
git remote remove origin >/dev/null 2>&1 || true
# токен используется только на время push и не сохраняется в .git/config
git remote add origin "https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git"
git push -u origin main
git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"

echo
echo "Готово: https://github.com/${OWNER}/${REPO}"
echo "Дальше: vercel.com → Add New → Project → Import Git Repository → выбрать $REPO"
echo "и добавить переменные: DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET"

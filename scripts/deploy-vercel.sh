#!/usr/bin/env bash
#
# Деплой на Vercel одной командой (без ручных кликов в интерфейсе).
#
# Нужен токен Vercel: vercel.com/account/tokens → Create Token.
# Значения переменных берутся из файла .env.vercel (или .env.neon / .env.local),
# щоб секрети не потрапляли в історію команд.
#
# Використання:
#   VERCEL_TOKEN=xxxxx ./scripts/deploy-vercel.sh            # production-деплой
#   VERCEL_TOKEN=xxxxx ./scripts/deploy-vercel.sh --preview  # preview-деплой
#
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN="${VERCEL_TOKEN:-}"
MODE="${1:---prod}"
PROJECT="${VERCEL_PROJECT:-bus-rent}"

if [ -z "$TOKEN" ]; then
  echo "Помилка: не задано VERCEL_TOKEN."
  echo "Отримати: https://vercel.com/account/tokens"
  echo "Приклад: VERCEL_TOKEN=xxxxx ./scripts/deploy-vercel.sh"
  exit 1
fi

# --- збираємо змінні середовища з першого наявного файлу -------------------
ENV_FILE=""
for f in .env.vercel .env.neon .env.local .env; do
  [ -f "$f" ] && ENV_FILE="$f" && break
done
if [ -z "$ENV_FILE" ]; then
  echo "Помилка: не знайдено файл зі змінними (.env.vercel / .env.neon / .env.local)"
  exit 1
fi
echo "→ Змінні беру з $ENV_FILE"

read_env() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- || true
}

REQUIRED=(DATABASE_URL JWT_SECRET ADMIN_EMAIL ADMIN_PASSWORD)
OPTIONAL=(TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID)

for key in "${REQUIRED[@]}"; do
  if [ -z "$(read_env "$key")" ]; then
    echo "Помилка: у $ENV_FILE не задано обов'язкову змінну $key"
    exit 1
  fi
done

echo "→ Підключаю проєкт $PROJECT..."
npx --yes vercel@latest link --yes --project "$PROJECT" --token "$TOKEN" >/dev/null

echo "→ Прописую змінні середовища (production)..."
for key in "${REQUIRED[@]}" "${OPTIONAL[@]}"; do
  val="$(read_env "$key")"
  if [ -n "$val" ]; then
    # видаляємо попереднє значення, якщо було, щоб уникнути дублювання
    npx --yes vercel@latest env rm "$key" production --yes --token "$TOKEN" >/dev/null 2>&1 || true
    printf '%s' "$val" | npx --yes vercel@latest env add "$key" production --token "$TOKEN" >/dev/null
    echo "   + $key"
  fi
done

# публічна адреса потрібна для webhook Telegram-бота
npx --yes vercel@latest env rm NEXT_PUBLIC_SITE_URL production --yes --token "$TOKEN" >/dev/null 2>&1 || true
SITE="$(read_env NEXT_PUBLIC_SITE_URL)"
if [ -z "$SITE" ]; then
  SITE="https://$PROJECT.vercel.app"
fi
printf '%s' "$SITE" | npx --yes vercel@latest env add NEXT_PUBLIC_SITE_URL production --token "$TOKEN" >/dev/null
echo "   + NEXT_PUBLIC_SITE_URL = $SITE"

echo "→ Деплой..."
if [ "$MODE" = "--preview" ]; then
  npx --yes vercel@latest deploy --token "$TOKEN"
else
  npx --yes vercel@latest deploy --prod --yes --token "$TOKEN"
fi

echo
echo "Готово. Наступні кроки:"
echo "  1) Відкрийте задеплоєний сайт — перший запит сам створить таблиці й наповнить базу."
echo "  2) Адмінка: <адреса>/adminpanel/login  ($(read_env ADMIN_EMAIL))"
echo "  3) Розділ «Telegram-бот» → «Підключити webhook» (Vercel має HTTPS)."

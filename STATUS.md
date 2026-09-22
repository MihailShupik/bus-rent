# STATUS — BusRent (лендінг оренди автобусів + адмін-панель + зовнішня БД)

Оновлено: 2026-09-22. Проєкт: `/home/ubuntu/projects/bus-rent`.
Джерело адмінки: `github.com/dmytropshenichnikov/ktk-landing` (клоновано, адаптовано, розширено).

## Стан: ГОТОВО (усі перевірки зелені)

- GitHub: **https://github.com/MihailShupik/bus-rent** (гілка `main`, 60 файлів)
- SSH-доступ налаштовано: ключ `~/.ssh/busrent_github`, хост-аліас `github-busrent`
  (`ssh -T git@github-busrent` → `Hi MihailShupik!`)
- Наступний крок: імпорт репозиторію у Vercel + env-змінні (README, розділ 5)

## Що зроблено
- Односторінковий сайт за ТЗ: шапка (glassmorphism), перший екран, форма заявки,
  «Про компанію», каталог транспорту, послуги, переваги, кроки замовлення, контакти, підвал.
- Кнопка «Замовити» на картці транспорту підставляє цей автобус у форму та скролить до неї.
- Галерея транспорту (кілька фото, вибір головного, зміна порядку).
- Адмін-панель з `ktk-landing`, адаптована: dashboard, заявки (статуси + CSV), автобуси,
  послуги, переваги, кроки, **універсальний конструктор блоків**, налаштування.
- Зовнішня безкоштовна БД: будь-який PostgreSQL (Neon / Supabase / Vercel Postgres).
  Схема (11 таблиць) + стартовий контент + адміністратор створюються автоматично.
- Усі іконки — SVG, без емодзі. Українська мова інтерфейсу; всі тексти редагуються в адмінці.

## Ключові файли
- `src/app/page.tsx`, `src/components/LandingPage.tsx`, `src/app/globals.css`
- `src/app/adminpanel/*` (layout + dashboard, applications, buses, services, advantages, steps, builder, settings)
- `src/app/api/admin/content/[type]/route.ts` — універсальний CRUD
- `src/lib/schema.ts`, `src/lib/content.ts`, `src/lib/seed-data.ts`, `src/lib/db.ts`, `src/lib/format.ts`
- `src/components/admin/ui.tsx` (Modal, поля, PhotosManager, ResourceManager), `useAsyncData.ts`

## Перевіreno (2026-09-22, після чистого `npm install`)
- `npx tsc --noEmit` — 0 помилок.
- `npm run lint` (eslint 9 + eslint-config-next 16) — 0 помилок / 0 попереджень.
- `npm test` (vitest) — 15/15 юніт-тестів (`src/lib/format.test.ts`).
- `npm run build` — успішно (22 маршрути).
- Playwright E2E — 39/39: секції, навігація, бургер, галерея, підстановка автобуса,
  валідація + відправка заявки, відсутність горизонтального скролу 375/820/1024/1440,
  вхід в адмінку, рендер 9 розділів, приховування транспорту.
- Живе оновлення: зміна ціни в адмінці одразу відображається на сайті (SSR, `force-dynamic`).
- Порожня БД (перевірено drop/recreate): 11 таблиць + 8 автобусів / 6 послуг / 8 переваг /
  4 кроки / 1 тип блоку + 3 елементи (FAQ) / 54 налаштування + адміністратор (scrypt).
  Тобто на новому безкоштовному PostgreSQL усе піднімається з нуля без ручних кроків.
- Публічний API: `/api/content`, `/api/contact` (валідація), `/api/track`, `/api/upload`, `/api/media/:id`.
- Адмін API: 401 без токена, логін, CRUD усіх типів, конструктор (типи + елементи), налаштування.

## Як запущено зараз
Продакшн-білд на порту **3000** (`npm start`), локальна БД `busrent`
(`postgresql://postgres:postgres@localhost:5432/busrent`).
Адмінка: `http://localhost:3000/adminpanel/login` → `admin@bus-rent.ua` / `busrent2026`.

## Наступні кроки (для продакшену)
1. Створити безкоштовний проєкт Neon і вставити `DATABASE_URL` (README, розділ 3).
2. Деплой на Vercel (README, розділ 5) + env-змінні.
3. Завантажити реальні фото автобусів у `/adminpanel/buses`.
4. За бажанням: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
5. Git-репозиторій не ініціалізовано і коміт не робився (не було явного запиту).

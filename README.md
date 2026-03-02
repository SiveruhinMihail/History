
# 📜 Klio – Сообщество историков

**Klio** – это современная платформа для историков, где можно публиковать статьи, обсуждать научные и популярные темы, создавать тематические сообщества и следить за активностью коллег. Проект построен на Nuxt 4 с бэкендом Supabase и полностью адаптирован под тёмную тему.

![GitHub package.json version](https://img.shields.io/github/package-json/v/yourusername/klio)
![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Особенности

- ✅ **Аутентификация** – регистрация, вход, выход через Supabase Auth.
- ✅ **Профили** – аватар, имя, описание в Markdown, уровень и статус пользователя.
- ✅ **Посты** – создание с изображениями, лайки, закладки, категории.
- ✅ **Комментарии** – древовидные ответы, лайки, изображения, real‑time обновления.
- ✅ **Сообщества** – создание, заявки, чат участников, рейтинг и верификация.
- ✅ **Модерация** – панель для одобрения постов, обработки жалоб, назначения модераторов.
- ✅ **Умная сортировка** – посты и комментарии сначала по популярности (лайки), потом по дате.
- ✅ **Тёмная тема** – переключатель, полностью адаптированный интерфейс.
- ✅ **Графики активности** – статистика пользователя и изменение рейтинга сообществ.
- ✅ **Поиск** – глобальный поиск по категориям и постам.
- ✅ **Адаптивный дизайн** – мобильная версия, бургер-меню.


## 🛠 Технологический стек

| Категория       | Технологии                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**    | [Nuxt 4](https://nuxt.com), [Vue 3](https://vuejs.org), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com), [Heroicons](https://heroicons.com), [FormKit](https://formkit.com), [Chart.js](https://www.chartjs.org) |
| **Backend**     | [Supabase](https://supabase.com) (PostgreSQL, Storage, Realtime, Auth)                                                                                                                                                                                  |
| **Инструменты** | ESLint, Prettier, Supabase CLI, Git                                                                                                                                                                                                                     |

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm / yarn / pnpm
- Аккаунт Supabase

### Установка

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/yourusername/klio.git
   cd klio
   ```
````

2. Установите зависимости:

   ```bash
   npm install
   ```

3. Создайте файл `.env` на основе `.env.example` и заполните ключи Supabase:

   ```env
   NUXT_PUBLIC_SUPABASE_URL=your-project-url
   NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NUXT_SERVICE_KEY=your-service-role-key
   ```

4. Запустите проект в режиме разработки:

   ```bash
   npm run dev
   ```

5. Откройте [http://localhost:3000](http://localhost:3000)

### Сборка для продакшена

```bash
npm run build
npm run preview
```

### Генерация статического сайта (для GitHub Pages)

```bash
npm run generate
```

---

## 📁 Структура проекта

```
klio/
├── app/
│   ├── components/          # Vue-компоненты
│   ├── composables/          # Логика (useAuth, usePosts, etc.)
│   ├── layouts/              # Шаблоны страниц
│   ├── pages/                # Страницы приложения
│   │   ├── auth/             # Вход/регистрация
│   │   ├── categories/       # Категории
│   │   ├── communities/      # Сообщества
│   │   ├── moderate/         # Модерация
│   │   ├── post/             # Посты
│   │   └── profile/          # Профили
│   ├── server/               # Серверные API-эндпоинты
│   └── utils/                 # Вспомогательные функции (image.ts)
├── public/                   # Статические файлы (favicon, шрифты)
├── types/                    # Сгенерированные типы Supabase
├── .env.example
├── nuxt.config.ts
├── package.json
└── README.md
```

---

## 📦 Скрипты

| Команда            | Описание                                 |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Запуск сервера разработки                |
| `npm run build`    | Сборка для продакшена                    |
| `npm run generate` | Генерация статического сайта             |
| `npm run preview`  | Предпросмотр продакшен‑сборки            |
| `npm run lint`     | Проверка кода ESLint                     |
| `npm run lint:fix` | Автоматическое исправление ошибок ESLint |
| `npm run format`   | Форматирование кода Prettier             |

---

## 🌐 Деплой на GitHub Pages

1. Установите `gh-pages`:

   ```bash
   npm install --save-dev gh-pages
   ```

2. Добавьте скрипт в `package.json`:

   ```json
   "deploy": "gh-pages --dotfiles -d .output/public"
   ```

3. Сгенерируйте статику и запустите деплой:
   ```bash
   npm run generate
   npm run deploy
   ```

Или используйте **GitHub Actions** – готовый workflow находится в `.github/workflows/deploy.yml`.

После деплоя сайт будет доступен по адресу:  
`https://Lum1nous.github.io/klio/`

---

## 📄 Лицензия

Проект распространяется под лицензией **MIT**.

---

## ✍️ Авторы

- **Lum1nous** – [GitHub](https://github.com/Lum1nous)

---

> Если у вас есть вопросы или предложения, создавайте **Issue**.  
> Приятного использования! 🎉

```

```

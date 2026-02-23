# Проект "Форум историков"

## Описание

Полнофункциональный форум для историков с возможностью создавать посты, комментировать, ставить лайки, добавлять в закладки, состоять в тематических сообществах, модерировать контент и отслеживать активность. Проект построен на **Nuxt 4** (Vue 3) с бэкендом **Supabase** (PostgreSQL, Storage, Realtime, Auth). Интерфейс разработан с использованием **Tailwind CSS**, **Heroicons**, **FormKit** для форм, **Chart.js** для графиков активности, **markdown-it** для форматирования текста и **Cropper.js** для обрезки аватаров. Код строго типизирован с помощью TypeScript, соблюдены современные стандарты качества и линтинга.

## Технологический стек

- **Frontend:** Nuxt 4 (Vue 3), TypeScript, Tailwind CSS, Heroicons, FormKit, Chart.js, markdown-it, lodash-es, Cropper.js
- **Backend:** Supabase (PostgreSQL, Storage, Realtime, Auth)
- **Инструменты разработки:** ESLint, Prettier, Supabase CLI

## Основные функции

- ✅ Аутентификация (регистрация, вход, выход, сброс пароля) через Supabase Auth
- ✅ Профили пользователей (публичные, редактирование, аватар с обрезкой)
- ✅ Посты (создание, просмотр, лайки, закладки, изображения)
- ✅ Комментарии (с ответами, лайками, изображениями, real-time обновления)
- ✅ Категории (каталог, посты в категориях)
- ✅ Сообщества (создание, вступление, заявки, чат, рейтинг сообществ)
- ✅ Умная сортировка постов (популярные/новые) и комментариев (по лайкам)
- ✅ Избранное (закладки на посты)
- ✅ Модерация контента (посты на проверке, жалобы, бан пользователей, удаление контента)
- ✅ Графики активности в профиле (Chart.js)
- ✅ Поиск по категориям и постам (главная страница)

## Установка и запуск

### Требования

- Node.js v18+
- npm / yarn / pnpm
- Аккаунт Supabase (бесплатный)

### Клонирование репозитория

```bash
git clone https://github.com/SiveruhinMihail/History
```

### Установка зависимостей

```bash
npm install
```

### Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NUXT_SERVICE_KEY=your-service-role-key
```

Получить ключи можно в настройках Supabase (Project Settings → API).

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

## Структура проекта

```
├── app/                    # Основная папка Nuxt (components, composables, pages, layouts)
│   ├── components/         # Переиспользуемые Vue-компоненты
│   │   ├── AvatarUpload.vue
│   │   ├── CategoryRow.vue
│   │   ├── CommentForm.vue
│   │   ├── CommentItem.vue
│   │   ├── Dropdown.vue
│   │   ├── Header.vue
│   │   ├── ImageViewer.vue
│   │   ├── PostCard.vue
│   │   ├── ProfileTabs.vue
│   │   ├── ReportModal.vue
│   │   └── UserPosts.vue
│   ├── composables/        # Логика, разделяемая между компонентами
│   │   ├── useAuth.ts
│   │   ├── useCommunity.ts
│   │   ├── useFavorites.ts
│   │   ├── usePosts.ts
│   │   ├── useStorage.ts
│   │   └── useUser.ts
│   ├── layouts/            # Шаблоны страниц
│   │   └── default.vue
│   ├── pages/              # Страницы приложения
│   │   ├── auth/
│   │   │   ├── login.vue
│   │   │   └── register.vue
│   │   ├── categories/
│   │   │   ├── [slug].vue
│   │   │   └── index.vue
│   │   ├── communities/
│   │   │   ├── [id].vue
│   │   │   ├── create.vue
│   │   │   └── edit/[id].vue
│   │   ├── moderate/
│   │   │   ├── posts.vue
│   │   │   └── reports.vue
│   │   ├── post/
│   │   │   └── [id].vue
│   │   ├── profile/
│   │   │   ├── [id].vue
│   │   │   ├── edit.vue
│   │   │   └── favorites.vue
│   │   ├── create.vue
│   │   └── index.vue
│   └── server/             # Серверные API-эндпоинты (в app/server)
│       └── api/
│           └── moderation/
│               ├── approve-post.post.ts
│               ├── ban-user-only.post.ts
│               ├── ban-user-with-content.post.ts
│               ├── delete-comment.post.ts
│               ├── delete-post.post.ts
│               └── resolve-report.post.ts
├── types/                   # Сгенерированные типы Supabase
│   └── supabase.ts
├── .env.example
├── nuxt.config.ts
├── package.json
├── eslint.config.mjs        # Конфигурация ESLint
└── README.md
```

## База данных

Основные таблицы (упрощённо):

- `user` – пользователи
- `post` – посты
- `post_images` – изображения постов
- `comments` – комментарии
- `comment_images` – изображения комментариев
- `like_to_post` – лайки постов
- `like_to_comment` – лайки комментариев
- `favorites` – закладки
- `category` – категории
- `post_categories` – связь постов и категорий
- `community` – сообщества
- `subscribers` – участники сообществ
- `community_messages` – чат сообщества
- `reports` – жалобы

## Ключевые composables

### `useAuth`

Управление аутентификацией, профилем текущего пользователя. Предоставляет:

- `profile`, `isLoading`, `isAuthenticated`
- `signUp`, `signIn`, `signOut`
- `updateProfile`, `loadProfile`

### `useUser`

Работа с данными других пользователей:

- `getUserProfile(authUid)` – профиль по UUID
- `checkUsernameUnique(username, excludeAuthUid)`
- `getUserFavorites(userId)`
- `getUserStats(userId)`
- `getUserActivityChart(userId)`

### `usePosts`

Загрузка постов с фильтрацией и сортировкой:

- `getHomeFeed(limit, sortBy?)`
- `getRecommendedPosts(limit, sortBy?)`
- `getPostsByCategory(categoryId, limit, offset, sortBy?)`
- `getCategoryBySlug(slug)`

### `useCommunity`

Управление сообществами:

- `getCommunity(id)`
- `getMembers(communityId, roleFilter?)`
- `join(communityId)`, `leave(communityId)`
- `approve(communityId, targetUserId)`, `reject(communityId, targetUserId)`
- `getMessages(communityId)`, `sendMessage(communityId, text)`
- `createCommunity(data)`, `updateCommunity(id, updates)`

### `useStorage`

Загрузка и оптимизация файлов в Supabase Storage:

- `uploadFile(bucket, file, folder, options)`
- `getPublicUrl(bucket, path)`
- `deleteFile(bucket, paths)`
- Специализированные `uploadAvatar`, `deleteAvatar`

### `useFavorites`

Работа с закладками:

- `toggleFavorite(postId)`
- `isFavorite(postId)`

## Модерация и жалобы

- Посты проходят проверку модератором (поле `moderation_status: pending/approved/rejected`). Модератор видит их на `/moderate/posts`.
- Пользователи могут пожаловаться на пост, комментарий или другого пользователя через кнопку с флагом. После отправки жалобы кнопка блокируется.
- Жалобы отображаются модератору на `/moderate/reports`. Модератор может:
  - Удалить контент (пост/комментарий)
  - Забанить автора (только бан или бан с удалением всего контента)
  - Отклонить жалобу (пометить как resolved)
- Бан пользователя осуществляется через серверные эндпоинты (с использованием `service_role`), что обходит RLS.

## Сообщества и рейтинг

- Пользователи могут создавать сообщества и вступать в них (заявки с ролью `pending`, которые администратор сообщества одобряет).
- Рейтинг сообщества начисляется за лайки под комментариями участников сообщества на момент написания комментария (связь через таблицу `comment_communities`, заполняемую триггером).

## Умная сортировка

- **Посты** на главной и в категориях сортируются сначала по популярности (поле `rating` – количество лайков), затем по дате (новые сверху). Переключатель сортировки отсутствует – всегда используется этот алгоритм.
- **Комментарии** сортируются по количеству лайков (`likes_count`), затем по дате (новые сверху). Поле `likes_count` обновляется триггерами.

## Переменные окружения

| Переменная                      | Описание                                               |
| ------------------------------- | ------------------------------------------------------ |
| `NUXT_PUBLIC_SUPABASE_URL`      | URL вашего Supabase проекта                            |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный анонимный ключ                               |
| `NUXT_SERVICE_KEY`              | Сервисный ключ (service_role) для серверных эндпоинтов |

## Лицензия

MIT

---

**Автор:** [Lum1nous]  
**Дата:** 24.02.2026

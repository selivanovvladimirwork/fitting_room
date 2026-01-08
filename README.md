# Fitting Room - AI Fashion Studio

Интерактивная виртуальная примерочная на базе искусственного интеллекта. Позволяет пользователям примерять одежду на свои фотографии или цифровых аватаров, создавая реалистичные образы.

## Особенности

- **Виртуальная примерка**: Загрузите свое фото или выберите аватара, добавьте одежду и получите готовый образ за считанные секунды.
- **Гардероб**: Удобное управление коллекцией одежды.
- **Лента образов**: Вдохновляйтесь образами от других пользователей.
- **Интеграция с Laravel**: Полная синхронизация с админ-панелью для управления контентом и пользователями.

## Технологии

- **Frontend**: React, Vite, Tailwind CSS
- **API**: Интеграция с Laravel Backend (Sanctum Auth)

## Запуск проекта

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите режим разработки:
   ```bash
   npm run dev
   ```

3. Для сборки продакшн версии:
   ```bash
   npm run build
   ```

## Работа с Git (Обновление)

Этот проект является частью репозитория: `https://github.com/brainwarcom/fittingroom.git`
Ветка для Frontend: `front`

**Как отправить обновления:**

1. Добавьте изменения:
   ```bash
   git add .
   ```
2. Создайте коммит:
   ```bash
   git commit -m "Описание изменений"
   ```
3. Отправьте в ветку `front`:
   ```bash
   git push origin front
   ```

## Production Deployment (Reg.ru)

**Frontend URL:** `https://fittingroom.fixers.su`  
**API Backend:** `https://adminfittingroom.fixers.su/public/api`

### Деплой

1. Соберите проект:
   ```bash
   npm run build
   ```

2. Загрузите содержимое папки `dist/` в `~/www/fittingroom.fixers.su/`

3. Создайте `.htaccess` для SPA-роутинга:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]
   ```

### API URL

API URL определяется автоматически в `services/api.ts`:
- Локально (`fittingroom.loc`): `https://fittingadmin.loc/api`
- Продакшен: `https://adminfittingroom.fixers.su/public/api`

### Обновление

После изменений пересоберите и загрузите `dist/` на сервер.

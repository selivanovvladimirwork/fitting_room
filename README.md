# Fitting Room - Закулисье (Backend)

Backend часть проекта "Fitting Room", построенная на Laravel + Filament.
Обеспечивает работу API, управление контентом, пользователями и интеграцию с AI-сервисами.

## Основные функции

- **API**: Endpoints для мобильного приложения и веб-клиента (Sanctum Auth).
- **Admin Panel**: Управление аватарами, гардеробом, постами и настройками через Filament.
- **AI Integration**: Настройка API ключей для генерации фото и видео.
- **SMTP**: Управление почтовыми настройками через админку.

## Запуск проекта

1. Установите зависимости:
   ```bash
   composer install
   ```

2. Запустите миграции:
   ```bash
   php artisan migrate
   ```

3. Запустите сервер (или используйте OSPanel/Web Server):
   ```bash
   php artisan serve
   ```

## Работа с Git (Обновление)

Этот проект является частью репозитория: `https://github.com/brainwarcom/fittingroom.git`
Ветка для Backend: `back`

**Как отправить обновления:**

1. Добавьте изменения:
   ```bash
   git add .
   ```
2. Создайте коммит:
   ```bash
   git commit -m "Описание изменений"
   ```
3. Отправьте в ветку `back`:
   ```bash
   git push origin back
   ```

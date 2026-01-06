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

## Troubleshooting: Ручной запуск миграций

Если `php artisan migrate` не работает из консоли (ошибки путей, версий PHP и т.д.), используйте **PHP-скрипт через браузер**:

1. Создайте файл `public/migrate_now.php` со следующим содержимым:
   ```php
   <?php
   require __DIR__ . '/../vendor/autoload.php';
   $app = require_once __DIR__ . '/../bootstrap/app.php';

   $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
   $response = $kernel->handle(
       $request = Illuminate\Http\Request::capture()
   );

   echo "<h1>Starting Migration...</h1>";

   try {
       Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
       echo "<pre>" . Illuminate\Support\Facades\Artisan::output() . "</pre>";
       echo "<h2 style='color: green'>Migration Completed Successfully!</h2>";
   } catch (\Exception $e) {
       echo "<h2 style='color: red'>Migration Failed!</h2>";
       echo "<pre>" . $e->getMessage() . "</pre>";
   }
   ```
2. Откройте в браузере: `https://fittingadmin.loc/migrate_now.php`
3. После успешного выполнения **обязательно удалите файл**!

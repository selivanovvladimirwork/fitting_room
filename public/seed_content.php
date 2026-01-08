<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "<h1>Running Content Seeder...</h1>";

try {
    // Fresh migration
    Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
    echo "<p>Пересоздание таблиц: DONE</p>";

    // Run Seeders
    Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    echo "<pre>" . Illuminate\Support\Facades\Artisan::output() . "</pre>";
    
    echo "<h2 style='color: green'>Content Generated Successfully!</h2>";
    echo "<p>БД заполнена товарами и связанными постами.</p>";
    echo "<p style='color: red; font-weight: bold;'>⚠️ УДАЛИТЕ ЭТОТ ФАЙЛ ПОСЛЕ ИСПОЛЬЗОВАНИЯ!</p>";
} catch (\Exception $e) {
    echo "<h2 style='color: red'>Error!</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}

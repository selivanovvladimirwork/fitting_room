<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "<h1>Running Images Migration...</h1>";

try {
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "<pre>" . Illuminate\Support\Facades\Artisan::output() . "</pre>";
    echo "<h2 style='color: green'>Migration Completed Successfully!</h2>";
    echo "<p>Добавлена колонка images (JSON), удалена image_url</p>";
    echo "<p style='color: red; font-weight: bold;'>⚠️ УДАЛИТЕ ЭТОТ ФАЙЛ ПОСЛЕ ИСПОЛЬЗОВАНИЯ!</p>";
} catch (\Exception $e) {
    echo "<h2 style='color: red'>Migration Failed!</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}

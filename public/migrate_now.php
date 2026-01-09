<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "<h1>Starting Migration & Seeding...</h1>";

try {
    // Миграции
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "<h2>Migration Output:</h2>";
    echo "<pre>" . Illuminate\Support\Facades\Artisan::output() . "</pre>";
    
    // Сидер популярных магазинов
    Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => 'Database\\Seeders\\PopularShopsSeeder',
        '--force' => true
    ]);
    echo "<h2>Seeder Output:</h2>";
    echo "<pre>" . Illuminate\Support\Facades\Artisan::output() . "</pre>";
    
    echo "<h2 style='color: green'>✅ Migration & Seeding Completed Successfully!</h2>";
    echo "<p><strong>⚠️ УДАЛИТЕ ЭТОТ ФАЙЛ ПОСЛЕ ИСПОЛЬЗОВАНИЯ!</strong></p>";
} catch (\Exception $e) {
    echo "<h2 style='color: red'>❌ Failed!</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

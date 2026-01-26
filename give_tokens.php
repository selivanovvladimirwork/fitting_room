<?php

use App\Models\User;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$user = User::find(17);

if ($user) {
    $user->tokens = 999999;
    $user->save();
    echo "User {$user->name} (ID: {$user->id}) now has {$user->tokens} tokens.\n";
} else {
    echo "User test_ivan not found.\n";
    // List users to see who exists
    $users = User::all();
    foreach ($users as $u) {
        echo "ID: {$u->id}, Name: {$u->name}, Email: {$u->email}\n";
    }
}

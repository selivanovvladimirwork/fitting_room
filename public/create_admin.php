<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "<h1>Restoring Admin Account...</h1>";

try {
    $email = 'admin@admin.com';
    $password = 'password';

    // Check if user exists
    $user = User::where('email', $email)->first();

    if ($user) {
        $user->update([
            'name' => 'Admin',
            'password' => Hash::make($password),
            'nickname' => 'admin'
        ]);
        echo "<h2 style='color: blue'>Admin account updated!</h2>";
    } else {
        User::create([
            'name' => 'Admin',
            'email' => $email,
            'password' => Hash::make($password),
            'nickname' => 'admin',
            'email_verified_at' => now(),
        ]);
        echo "<h2 style='color: green'>Admin account created successfully!</h2>";
    }
    
    echo "<p><strong>Email:</strong> $email</p>";
    echo "<p><strong>Password:</strong> $password</p>";
    echo "<hr>";
    echo "<p style='color: red'>Please delete this file (public/create_admin.php) after use!</p>";

} catch (\Exception $e) {
    echo "<h2 style='color: red'>Error!</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}

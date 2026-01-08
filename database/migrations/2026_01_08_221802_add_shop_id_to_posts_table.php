<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });
    }
};

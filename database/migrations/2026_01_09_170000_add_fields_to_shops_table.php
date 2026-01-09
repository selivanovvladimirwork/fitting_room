<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('domain')->nullable()->after('slug');
            $table->string('category')->nullable()->after('domain');
            $table->boolean('is_popular')->default(false)->after('description');
            $table->integer('sort_order')->default(0)->after('is_popular');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['domain', 'category', 'is_popular', 'sort_order']);
        });
    }
};

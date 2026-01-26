<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('tokens')->default(0)->after('password');
            $table->integer('daily_generations_count')->default(0)->after('tokens');
            $table->date('last_generation_date')->nullable()->after('daily_generations_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tokens', 'daily_generations_count', 'last_generation_date']);
        });
    }
};

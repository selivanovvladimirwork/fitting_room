<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorite_external_shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('domain');
            $table->string('url')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'domain']);
            $table->index('domain');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorite_external_shops');
    }
};

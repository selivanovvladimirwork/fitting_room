<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_api_settings', function (Blueprint $table) {
            $table->id();
            $table->string('photo_api_key')->nullable();
            $table->string('video_api_key')->nullable();
            $table->bigInteger('photo_tokens_used')->default(0);
            $table->bigInteger('video_tokens_used')->default(0);
            $table->bigInteger('photo_tokens_limit')->default(100000);
            $table->bigInteger('video_tokens_limit')->default(100000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_api_settings');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_group_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['post_group_id', 'post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_group_posts');
    }
};

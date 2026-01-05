<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('digital_twins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('image_url')->nullable();
            $table->integer('height')->nullable();
            $table->integer('weight')->nullable();
            $table->integer('chest')->nullable();
            $table->integer('waist')->nullable();
            $table->integer('hips')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('digital_twins');
    }
};

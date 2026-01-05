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
        Schema::create('smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('host')->default('smtp.yandex.ru');
            $table->integer('port')->default(465);
            $table->string('username')->nullable();
            $table->text('password')->nullable(); // encrypted
            $table->string('encryption')->default('ssl'); // ssl, tls, null
            $table->string('from_address')->nullable();
            $table->string('from_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smtp_settings');
    }
};

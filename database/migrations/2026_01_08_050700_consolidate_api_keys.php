<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_api_settings', function (Blueprint $table) {
            $table->string('api_key')->nullable()->after('id');
        });

        // Migrate data from photo_api_key to api_key
        DB::table('ai_api_settings')->update([
            'api_key' => DB::raw('COALESCE(photo_api_key, video_api_key)')
        ]);

        Schema::table('ai_api_settings', function (Blueprint $table) {
            $table->dropColumn(['photo_api_key', 'video_api_key']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_api_settings', function (Blueprint $table) {
            $table->string('photo_api_key')->nullable();
            $table->string('video_api_key')->nullable();
        });

        DB::table('ai_api_settings')->update([
            'photo_api_key' => DB::raw('api_key'),
            'video_api_key' => DB::raw('api_key')
        ]);

        Schema::table('ai_api_settings', function (Blueprint $table) {
            $table->dropColumn('api_key');
        });
    }
};

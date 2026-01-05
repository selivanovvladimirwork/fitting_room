<?php

namespace App\Providers;

use App\Models\SmtpSetting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

class DynamicMailServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Загружаем настройки SMTP из БД при каждом запросе
        $this->app->booted(function () {
            $this->loadSmtpSettings();
        });
    }

    /**
     * Загрузить SMTP настройки из базы данных
     */
    protected function loadSmtpSettings(): void
    {
        try {
            // Проверяем что таблица существует
            if (!Schema::hasTable('smtp_settings')) {
                return;
            }

            $settings = SmtpSetting::current();

            if (!$settings || !$settings->username) {
                return;
            }

            Config::set('mail.default', 'smtp');
            Config::set('mail.mailers.smtp.host', $settings->host);
            Config::set('mail.mailers.smtp.port', $settings->port);
            Config::set('mail.mailers.smtp.encryption', $settings->encryption ?: null);
            Config::set('mail.mailers.smtp.username', $settings->username);
            Config::set('mail.mailers.smtp.password', $settings->password);
            
            if ($settings->from_address) {
                Config::set('mail.from.address', $settings->from_address);
            }
            if ($settings->from_name) {
                Config::set('mail.from.name', $settings->from_name);
            }

        } catch (\Exception $e) {
            // Если БД недоступна — используем дефолтные настройки из .env
            report($e);
        }
    }
}

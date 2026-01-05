<?php

namespace App\Filament\Pages;

use App\Models\SmtpSetting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Mail;

class SmtpSettings extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-envelope';
    protected static ?string $navigationLabel = 'Настройки SMTP';
    protected static ?string $title = 'Настройки почты (SMTP)';
    protected static ?string $navigationGroup = 'Настройки';
    protected static ?int $navigationSort = 100;
    
    protected static string $view = 'filament.pages.smtp-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $settings = SmtpSetting::getOrCreate();
        $this->form->fill($settings->toArray());
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Yandex SMTP')
                    ->description('Настройки подключения к почтовому серверу Яндекс')
                    ->schema([
                        Forms\Components\TextInput::make('host')
                            ->label('SMTP Хост')
                            ->default('smtp.yandex.ru')
                            ->required(),
                        Forms\Components\TextInput::make('port')
                            ->label('Порт')
                            ->numeric()
                            ->default(465)
                            ->required(),
                        Forms\Components\Select::make('encryption')
                            ->label('Шифрование')
                            ->options([
                                'ssl' => 'SSL',
                                'tls' => 'TLS',
                                '' => 'Без шифрования',
                            ])
                            ->default('ssl')
                            ->required(),
                        Forms\Components\TextInput::make('username')
                            ->label('Логин (email)')
                            ->email()
                            ->placeholder('your-email@yandex.ru')
                            ->required(),
                        Forms\Components\TextInput::make('password')
                            ->label('Пароль приложения')
                            ->password()
                            ->revealable()
                            ->helperText('Создайте пароль приложения в настройках Яндекс ID')
                            ->required(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Отправитель')
                    ->schema([
                        Forms\Components\TextInput::make('from_address')
                            ->label('Email отправителя')
                            ->email()
                            ->placeholder('noreply@yourdomain.com'),
                        Forms\Components\TextInput::make('from_name')
                            ->label('Имя отправителя')
                            ->placeholder('FittingRoom'),
                    ])
                    ->columns(2),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();
        
        $settings = SmtpSetting::getOrCreate();
        $settings->update($data);

        Notification::make()
            ->title('Настройки сохранены')
            ->success()
            ->send();
    }

    public function testEmail(): void
    {
        try {
            $settings = SmtpSetting::current();
            
            if (!$settings || !$settings->username) {
                Notification::make()
                    ->title('Сначала сохраните настройки')
                    ->warning()
                    ->send();
                return;
            }

            // Обновляем конфигурацию
            config([
                'mail.mailers.smtp.host' => $settings->host,
                'mail.mailers.smtp.port' => $settings->port,
                'mail.mailers.smtp.encryption' => $settings->encryption ?: null,
                'mail.mailers.smtp.username' => $settings->username,
                'mail.mailers.smtp.password' => $settings->password,
                'mail.from.address' => $settings->from_address ?: $settings->username,
                'mail.from.name' => $settings->from_name ?: 'FittingRoom',
            ]);

            Mail::raw('Тестовое письмо от FittingRoom Admin. Если вы видите это сообщение — SMTP настроен правильно!', function ($message) use ($settings) {
                $message->to($settings->username)
                    ->subject('Тест SMTP - FittingRoom');
            });

            Notification::make()
                ->title('Тестовое письмо отправлено!')
                ->body('Проверьте почтовый ящик: ' . $settings->username)
                ->success()
                ->send();

        } catch (\Exception $e) {
            Notification::make()
                ->title('Ошибка отправки')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('test')
                ->label('Отправить тестовое письмо')
                ->icon('heroicon-o-paper-airplane')
                ->action('testEmail')
                ->color('gray'),
            Action::make('save')
                ->label('Сохранить')
                ->icon('heroicon-o-check')
                ->action('save'),
        ];
    }
}

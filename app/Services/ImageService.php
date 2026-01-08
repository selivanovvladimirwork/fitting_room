<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Сохраняет изображение из base64 строки
     *
     * @param string|null $base64Image Строка с изображением (может быть base64 или URL)
     * @param string $folder Папка для сохранения (внутри public диска)
     * @return string|null Относительный путь к файлу или исходная строка, если это не base64
     */
    public function saveFromBase64(?string $base64Image, string $folder): ?string
    {
        if (empty($base64Image)) {
            return null;
        }

        // Если это уже URL (начинается с http), возвращаем как есть (или обрабатываем по необходимости)
        // Но обычно мы хотим сохранить base64. 
        // Если строка не содержит "data:image", считаем, что это не base64 для загрузки
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Image, $matches)) {
            return $base64Image;
        }

        // Получаем расширение файла
        $extension = strtolower($matches[1]);
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        // Декодируем данные
        $imageData = substr($base64Image, strpos($base64Image, ',') + 1);
        $imageData = base64_decode($imageData);

        if ($imageData === false) {
            return null; // Ошибка декодирования
        }

        // Генерируем уникальное имя
        $fileName = Str::uuid() . '.' . $extension;
        $filePath = $folder . '/' . $fileName;

        // Сохраняем на диск 'public'
        Storage::disk('public')->put($filePath, $imageData);

        return $filePath;
    }
}

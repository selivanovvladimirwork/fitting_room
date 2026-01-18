/**
 * Cloudflare Worker для проксирования запросов к Gemini API
 * Обходит географические ограничения Google для России
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

// Разрешённые origins (настройте под ваш домен)
const ALLOWED_ORIGINS = [
    'https://adminfittingroom.fixers.su',
    'http://adminfittingroom.fixers.su',
    'https://fittingroom.fixers.su',
    'http://fittingroom.fixers.su',
    'http://localhost:3000',
    'http://localhost:5173'
];

export default {
    async fetch(request, env) {
        // Обработка CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS(request);
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // Проверяем origin
        const origin = request.headers.get('Origin') || '';
        const corsHeaders = getCORSHeaders(origin);

        // Если это корневой путь - возвращаем статус
        if (path === '/' || path === '') {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'Gemini API Proxy',
                timestamp: new Date().toISOString()
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        try {
            // Извлекаем API ключ из query параметра или заголовка
            let apiKey = url.searchParams.get('key');
            if (!apiKey) {
                apiKey = request.headers.get('X-API-Key');
            }
            if (!apiKey && env.GEMINI_API_KEY) {
                apiKey = env.GEMINI_API_KEY;
            }

            if (!apiKey) {
                return new Response(JSON.stringify({
                    error: 'API key is required. Pass it as ?key= parameter or X-API-Key header'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Строим URL к Gemini API
            const geminiUrl = new URL(path, GEMINI_API_BASE);
            geminiUrl.searchParams.set('key', apiKey);

            // Копируем остальные query параметры (кроме key)
            for (const [key, value] of url.searchParams) {
                if (key !== 'key') {
                    geminiUrl.searchParams.set(key, value);
                }
            }

            // Подготавливаем заголовки для запроса к Gemini (HTTP-заголовки в нижнем регистре)
            const headers = new Headers();
            headers.set('content-type', request.headers.get('Content-Type') || 'application/json');

            // Делаем запрос к Gemini API
            const geminiResponse = await fetch(geminiUrl.toString(), {
                method: request.method,
                headers: headers,
                body: request.method !== 'GET' ? await request.text() : undefined
            });

            // Создаём ответ с CORS заголовками
            const responseHeaders = new Headers(geminiResponse.headers);
            Object.entries(corsHeaders).forEach(([key, value]) => {
                responseHeaders.set(key, value);
            });

            return new Response(geminiResponse.body, {
                status: geminiResponse.status,
                statusText: geminiResponse.statusText,
                headers: responseHeaders
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Proxy error: ' + error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
};

function handleCORS(request) {
    const origin = request.headers.get('Origin') || '';
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(origin)
    });
}

function getCORSHeaders(origin) {
    // Проверяем, разрешён ли origin
    const isAllowed = ALLOWED_ORIGINS.some(allowed =>
        origin === allowed || origin.startsWith(allowed)
    );

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

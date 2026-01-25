import React, { useState } from 'react';

interface InstructionsViewProps {
    onBack: () => void;
}

const InstructionsView: React.FC<InstructionsViewProps> = ({ onBack }) => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqItems = [
        {
            question: "Что делать, если генерация долго не завершается?",
            answer: "Генерация с помощью модели Veo может занимать от 5 до 10 минут. Если процесс длится дольше 15 минут, попробуйте обновить страницу и начать заново. Убедитесь, что у вас стабильное интернет-соединение."
        },
        {
            question: "Почему результат не похож на меня?",
            answer: "Качество результата зависит от предоставленных фотографий. Используйте чёткие фронтальные снимки с хорошим освещением. Избегайте фото с очками, головными уборами или экстремальными ракурсами. Попробуйте загрузить 3-5 разных фото для лучшего результата."
        },
        {
            question: "Можно ли использовать чужие фотографии?",
            answer: "Технически это возможно, но мы настоятельно не рекомендуем использовать чужие фотографии без разрешения. Это нарушает конфиденциальность и может привести к плохим результатам генерации."
        },
        {
            question: "Сколько предметов можно примерить одновременно?",
            answer: "Максимум 5 предметов за одну генерацию. Рекомендуем начинать с 1-2 предметов, чтобы понять, как работает система и получить лучший результат."
        },
        {
            question: "Что происходит при неудачной валидации?",
            answer: "Система автоматически проверяет результаты генерации. Если результат не показывает человека в одежде, система автоматически повторяет генерацию (до 3 попыток) с небольшими изменениями в промпте."
        },
        {
            question: "Как сохранить удачные генерации?",
            answer: "После каждой генерации вы можете нажать 'В гардероб', чтобы сохранить результат в персональную коллекцию. Все генерации также сохраняются в истории, где их можно скачать или поделиться."
        }
    ];

    return (
        <div className="flex flex-col w-full px-1 md:px-6 max-w-4xl mx-auto pt-16 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Инструкции</h1>
                    <p className="text-gray-500 text-sm mt-1">Рекомендации и ограничения</p>
                </div>
            </div>

            {/* Photo Recommendations */}
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    Рекомендации по фотографиям
                </h2>

                {/* Face Photos */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-bold mb-4">Фотографии лица (3-5 шт)</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Для создания качественного цифрового аватара загрузите несколько фотографий, где хорошо видно лицо.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-green-900">Хорошо</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-green-800">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Фронтальный ракурс, взгляд в камеру
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Хорошее естественное освещение
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Чёткие черты лица
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Нейтральное выражение
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Без очков и головных уборов
                                </li>
                            </ul>
                        </div>

                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-red-900">Плохо</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-red-800">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Профиль или 3/4 ракурс
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Сильные тени на лице
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Размытые или низкого качества
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Экстремальные выражения
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Солнечные очки, маски, шапки
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-blue-900 leading-relaxed">
                                <span className="font-bold">Совет:</span> Используйте 3-5 разных фотографий с небольшими вариациями в ракурсе (вращение головы ±15°) для лучшего результата.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Photos */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Фотографии тела (опционально)</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Загрузите фото во весь рост для более точной генерации одежды.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-green-900">Хорошо</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-green-800">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Во полный рост, видны голова и ноги
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Однотонная облегающая одежда
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Прямая поза, руки вдоль тела
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                    Хорошие пропорции на фото
                                </li>
                            </ul>
                        </div>

                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-red-900">Плохо</h4>
                            </div>
                            <ul className="space-y-2 text-sm text-red-800">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Обрезанные части тела
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Объёмная или мешковатая одежда
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Сложные позы или движение
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                    Искажённые пропорции
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Limitations */}
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    Ограничения генерации
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Максимум предметов</h3>
                        <p className="text-gray-600 text-sm">До 5 предметов за одну генерацию</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Время генерации</h3>
                        <p className="text-gray-600 text-sm">5-10 минут для одного запроса</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Автоматический retry</h3>
                        <p className="text-gray-600 text-sm">До 3 попыток при неудачной валидации</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Требуется авторизация</h3>
                        <p className="text-gray-600 text-sm">Зарегистрируйтесь для использования</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Качество изображений</h3>
                        <p className="text-gray-600 text-sm">JPG/PNG до 10MB на фото</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-2">Множественные аватары</h3>
                        <p className="text-gray-600 text-sm">Создавайте неограниченно</p>
                    </div>
                </div>
            </section>

            {/* Best Practices */}
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    Лучшие практики
                </h2>

                <div className="space-y-4">
                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2">Выберите подходящий аватар</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    При создании нескольких аватаров выберите тот, который лучше всего подходит по росту и типу фигуры для конкретного типа одежды. Разные аватары можно использовать для разных стилей.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2">Комбинируйте похожие стили</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Для лучшего результата выбирайте вещи из одного стиля или с похожей цветовой гаммой. Например, сочетайте классические пиджаки с брюками, а не с джинсами.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2">Сохраняйте удачные результаты</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Используйте кнопку "В гардероб" для сохранения удачных генераций. Это позволит вам создавать коллекции образов и повторно использовать понравившиеся комбинации.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2">Используйте историю генераций</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Все генерации сохраняются в истории. Вы можете скачать понравившиеся изображения, опубликовать их в ленту или просто просматривать свои прошлые попытки.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    Часто задаваемые вопросы
                </h2>

                <div className="space-y-3">
                    {faqItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-all"
                            >
                                <span className="font-bold pr-4">{item.question}</span>
                                <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            {expandedFaq === index && (
                                <div className="px-6 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Help CTA */}
            <div className="bg-gradient-to-br from-black to-gray-800 rounded-[32px] p-8 md:p-10 text-center text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Остались вопросы?</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
                    Если вы не нашли ответ на свой вопрос, свяжитесь с нашей службой поддержки для получения дополнительной помощи.
                </p>
                <button className="px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
                    Связаться с поддержкой
                </button>
            </div>
        </div>
    );
};

export default InstructionsView;
import React, { useState } from 'react';

interface AuthViewProps {
  onLogin: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login State
  const [loginForm, setLoginForm] = useState({
    login: 'Admin',
    password: 'qwerty1234'
  });

  // Register State
  const [registerForm, setRegisterForm] = useState({
    nickname: '@admin',
    firstName: 'Admin',
    lastName: 'Admin',
    phone: '+79207770077',
    phoneCode: '0000',
    email: 'admin@g.com',
    emailCode: '0000',
    password: 'qwerty1234'
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock validation
    if (loginForm.login === 'Admin' && loginForm.password === 'qwerty1234') {
      onLogin();
    } else {
      alert('Неверный логин или пароль (используйте Admin / qwerty1234)');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Регистрация успешна! Теперь войдите.');
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
       {/* Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="liquid-glass rounded-[40px] p-8 md:p-12 shadow-2xl border-white/50 backdrop-blur-xl">
            
            {/* Header Switcher */}
            <div className="flex justify-center mb-10">
                <div className="bg-white/40 p-1.5 rounded-full flex shadow-inner">
                    <button 
                        onClick={() => setMode('login')}
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'login' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Авторизация
                    </button>
                    <button 
                         onClick={() => setMode('register')}
                         className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'register' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Регистрация
                    </button>
                </div>
            </div>

            {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 ml-4">Логин</label>
                             <input 
                                type="text" 
                                value={loginForm.login}
                                onChange={e => setLoginForm({...loginForm, login: e.target.value})}
                                className="w-full px-6 py-4 bg-white/50 border border-transparent focus:border-black/10 focus:bg-white rounded-[24px] outline-none transition-all placeholder:text-gray-400"
                                placeholder="Введите логин"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 ml-4">Пароль</label>
                             <input 
                                type="password" 
                                value={loginForm.password}
                                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                className="w-full px-6 py-4 bg-white/50 border border-transparent focus:border-black/10 focus:bg-white rounded-[24px] outline-none transition-all placeholder:text-gray-400"
                                placeholder="Введите пароль"
                             />
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-500 max-w-xs mx-auto">
                        При нажатии на "Авторизация" вы соглашаетесь с условиями сервиса
                    </p>

                    <button 
                        type="submit"
                        className="w-full py-4 bg-black text-white font-bold rounded-[24px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                        Войти
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                     <p className="text-sm text-gray-500 text-center mb-4">
                        Заполните данные для создания нового аккаунта
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <input 
                            type="text" 
                            placeholder="Никнейм (@admin)"
                            value={registerForm.nickname}
                            onChange={e => setRegisterForm({...registerForm, nickname: e.target.value})}
                            className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                        />
                        <input 
                            type="text" 
                            placeholder="Имя"
                            value={registerForm.firstName}
                            onChange={e => setRegisterForm({...registerForm, firstName: e.target.value})}
                            className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                        />
                         <input 
                            type="text" 
                            placeholder="Фамилия"
                            value={registerForm.lastName}
                            onChange={e => setRegisterForm({...registerForm, lastName: e.target.value})}
                            className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                        />
                         <div className="flex gap-3">
                            <input 
                                type="tel" 
                                placeholder="Телефон"
                                value={registerForm.phone}
                                onChange={e => setRegisterForm({...registerForm, phone: e.target.value})}
                                className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                            />
                             <input 
                                type="text" 
                                placeholder="Код"
                                value={registerForm.phoneCode}
                                onChange={e => setRegisterForm({...registerForm, phoneCode: e.target.value})}
                                className="w-24 px-3 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm text-center"
                            />
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="email" 
                                placeholder="Почта"
                                value={registerForm.email}
                                onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                                className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                            />
                             <input 
                                type="text" 
                                placeholder="Код"
                                value={registerForm.emailCode}
                                onChange={e => setRegisterForm({...registerForm, emailCode: e.target.value})}
                                className="w-24 px-3 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm text-center"
                            />
                        </div>
                         <input 
                            type="password" 
                            placeholder="Пароль"
                            value={registerForm.password}
                            onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                            className="w-full px-5 py-3.5 bg-white/50 rounded-[20px] outline-none focus:bg-white transition-all text-sm"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-4 bg-black text-white font-bold rounded-[24px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest mt-4"
                    >
                        Регистрация
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;

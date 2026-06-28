import { useState, useEffect } from 'react';
import { CustomCursor } from './components/CustomCursor';
import { ThemeToggle } from './components/ThemeToggle';
import { KanbanBoard } from './components/KanbanBoard';
import { LoginView } from './components/LoginView';
import { authService } from './services/authService';
import gsap from 'gsap';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  useEffect(() => {
    const handleAuthLogout = () => setIsAuthenticated(false);
    window.addEventListener('auth-logout', handleAuthLogout);
    
    if (isAuthenticated) {
      gsap.fromTo('.header-item', 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
      gsap.fromTo('.board-container', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power2.out' }
      );
    }

    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div dir="ltr">
        <CustomCursor />
        <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div dir="ltr" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-300 pb-8 overflow-hidden">
      <CustomCursor />

      <header className="border-b border-zinc-200/65 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 header-item">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-500 animate-pulse shadow-md shadow-brand-500/50" />
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-500 dark:to-brand-300 tracking-tight">
              Contact Messages Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4 header-item">
            <ThemeToggle />
            <button
              onClick={() => {
                authService.logout();
                setIsAuthenticated(false);
              }}
              className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:border-rose-500/20 transition-all duration-300 bg-zinc-50 dark:bg-zinc-900"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 scale-x-[-1]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <section className="board-container">
          <KanbanBoard />
        </section>
      </main>
    </div>
  );
}
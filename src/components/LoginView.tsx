import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import gsap from 'gsap';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView = ({ onLoginSuccess }: LoginViewProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Gentle card entry transition on load
    gsap.fromTo('.login-card', 
      { opacity: 0, scale: 0.96, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  // TanStack Query Mutation for handling the login API call
  const loginMutation = useMutation({
    mutationFn: () => authService.login(username, password),
    onSuccess: () => {
      setError('');
      
      // Execute the fluid GSAP transition timeline on success
      const tl = gsap.timeline({
        onComplete: () => {
          onLoginSuccess();
        }
      });

      tl.to('.login-card', {
        opacity: 0,
        scale: 0.95,
        y: -30,
        duration: 0.5,
        ease: 'power3.inOut'
      })
      .to('.bg-glow', {
        scale: 1.4,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.inOut'
      }, '-=0.4');
    },
    onError: (err: any) => {
      // Extract error message dynamically from server response, defaulting if empty
      const errorMessage = err.response?.data?.message || 'Invalid username or password.';
      setError(errorMessage);
      
      // Execute the organic physical card shake on validation failure
      gsap.fromTo('.login-card', 
        { x: 0 }, 
        { 
          x: 10, 
          duration: 0.08, 
          repeat: 5, 
          yoyo: true, 
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.set('.login-card', { x: 0 });
          }
        }
      );
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div 
      ref={containerRef} 
      dir="ltr" 
      className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden px-4"
    >
      {/* Dynamic blurred glow rings in background */}
      <div className="bg-glow absolute top-1/4 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="bg-glow absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card box with clean borders and subtle spacing */}
      <div className="login-card w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-8 rounded-2xl shadow-xl z-10 relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-lg font-black text-zinc-800 dark:text-zinc-100 tracking-tight">Contact Admin Portal</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Core Team — Sign in to manage inbox</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {/* Username Input */}
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-semibold">Username</label>
            <input
              type="text"
              value={username}
              disabled={loginMutation.isPending}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full p-3.5 border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs disabled:opacity-50"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              disabled={loginMutation.isPending}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3.5 border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs disabled:opacity-50"
            />
          </div>

          {/* Dynamic Error Message Box */}
          {error && (
            <div className="flex items-center gap-1.5 justify-center py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <p className="text-[11px] text-rose-500 font-bold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
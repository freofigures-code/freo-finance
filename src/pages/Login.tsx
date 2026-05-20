import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou senha incorretos. Verifique suas credenciais.');
      setLoading(false);
    } else {
      // onAuthStateChange no App.tsx cuidará do redirecionamento
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background ambient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-gold)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 border border-[var(--color-brand-gold)] rotate-45 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(226,177,93,0.15)] relative bg-gradient-to-br from-transparent to-[#1a150c]">
            <span className="-rotate-45 font-bold text-[var(--color-brand-gold)] text-3xl md:text-4xl relative -top-1 -left-1 font-serif">F</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          FREO FIGURES
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-brand-gold)] font-medium tracking-widest uppercase">
          Gestão Financeira Premium
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[var(--card)] py-8 px-4 shadow-2xl border border-[var(--border)] sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-medium text-[var(--muted-foreground)] mb-1">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--background)] rounded-lg placeholder-[var(--color-brand-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] sm:text-sm text-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-medium text-[var(--muted-foreground)] mb-1">
                Senha
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-brand-border-light)] bg-[var(--background)] rounded-lg placeholder-[var(--color-brand-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] sm:text-sm text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[var(--color-brand-gold)] focus:ring-[var(--color-brand-gold)] border-[var(--border)] bg-[var(--background)] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--color-brand-text-subtle)]">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[var(--color-brand-gold)] hover:text-white transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-bold tracking-wide"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

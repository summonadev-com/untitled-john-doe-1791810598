import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (!data.session) setInfo('Check your email to confirm your account, then sign in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-indigo-400 dark:border-slate-600 dark:text-slate-100';

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-xl bg-white p-6 shadow dark:bg-slate-800">
      <h2 className="mb-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        {mode === 'signin' ? 'Sign in to see your tasks.' : 'Your tasks will sync across all your devices.'}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
          setInfo(null);
        }}
        className="mt-4 w-full text-center text-sm text-indigo-600 hover:underline"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}

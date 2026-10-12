import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthForm } from '@/components/AuthForm';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type Priority = 'high' | 'medium' | 'low';
type Todo = { id: string; text: string; done: boolean; due: string; priority: Priority };
type Filter = 'all' | 'active' | 'completed';

type TodoRow = { id: string; text: string; done: boolean; due: string | null; priority: Priority };

const PRIORITY_STYLE: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function fromRow(r: TodoRow): Todo {
  return { id: r.id, text: r.text, done: r.done, due: r.due ?? '', priority: r.priority };
}

function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setTodos([]);
      return;
    }
    let cancelled = false;
    setLoadingTodos(true);
    supabase
      .from('todos')
      .select('id,text,done,due,priority')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setTodos((data as TodoRow[]).map(fromRow));
        setLoadingTodos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const today = new Date().toISOString().slice(0, 10);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !session) return;
    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: session.user.id, text: text.trim(), due: due || null, priority })
      .select('id,text,done,due,priority')
      .single();
    if (error) return setError(error.message);
    setTodos([fromRow(data as TodoRow), ...todos]);
    setText('');
    setDue('');
  }

  async function update(id: string, patch: Partial<Todo>) {
    const prev = todos;
    setTodos(todos.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const row: Partial<TodoRow> = {};
    if (patch.text !== undefined) row.text = patch.text;
    if (patch.done !== undefined) row.done = patch.done;
    if (patch.due !== undefined) row.due = patch.due || null;
    if (patch.priority !== undefined) row.priority = patch.priority;
    const { error } = await supabase.from('todos').update(row).eq('id', id);
    if (error) {
      setError(error.message);
      setTodos(prev);
    }
  }

  async function remove(ids: string[]) {
    const prev = todos;
    setTodos(todos.filter((x) => !ids.includes(x.id)));
    const { error } = await supabase.from('todos').delete().in('id', ids);
    if (error) {
      setError(error.message);
      setTodos(prev);
    }
  }

  function startEdit(t: Todo) {
    setEditingId(t.id);
    setEditText(t.text);
    setEditDue(t.due);
    setEditPriority(t.priority);
  }

  function saveEdit() {
    if (editText.trim() && editingId) {
      update(editingId, { text: editText.trim(), due: editDue, priority: editPriority });
    }
    setEditingId(null);
  }

  const visible = todos
    .filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.done : t.done))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = PRIORITY_RANK[a.priority];
      const pb = PRIORITY_RANK[b.priority];
      if (pa !== pb) return pa - pb;
      if (a.due && b.due) return a.due.localeCompare(b.due);
      return a.due ? -1 : b.due ? 1 : 0;
    });
  const remaining = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - remaining;

  const inputCls =
    'rounded-lg border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-indigo-400 dark:border-slate-600 dark:text-slate-100';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white px-4 py-12 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Tasks</h1>
          <div className="flex gap-2">
            {session && (
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            )}
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
              className="rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {!authReady ? (
          <p className="mt-10 text-center text-slate-400">Loading…</p>
        ) : !session ? (
          <AuthForm />
        ) : (
          <>
            <p className="mb-6 text-slate-500">
              {remaining} task{remaining === 1 ? '' : 's'} left · {session.user.email}
            </p>

            {error && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-3 font-medium">Dismiss</button>
              </div>
            )}

            <form onSubmit={add} className="mb-6 flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow dark:bg-slate-800">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" className={`min-w-0 flex-1 ${inputCls}`} />
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputCls} text-slate-600`} />
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={`${inputCls} text-slate-600`}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Add</button>
            </form>

            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(['all', 'active', 'completed'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1 text-sm capitalize ${filter === f ? 'bg-white font-medium text-indigo-600 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {doneCount > 0 && (
                <button
                  onClick={() => remove(todos.filter((t) => t.done).map((t) => t.id))}
                  className="text-sm text-slate-500 hover:text-red-500"
                >
                  Clear completed
                </button>
              )}
            </div>

            <ul className="space-y-2">
              {visible.map((t) => {
                const overdue = !t.done && t.due && t.due < today;
                if (editingId === t.id) {
                  return (
                    <li key={t.id} className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className={`min-w-0 flex-1 ${inputCls}`}
                      />
                      <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className={`${inputCls} text-slate-600`} />
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className={`${inputCls} text-slate-600`}>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button onClick={saveEdit} className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                    </li>
                  );
                }
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => update(t.id, { done: !t.done })}
                      className="h-5 w-5 accent-indigo-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={t.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}>{t.text}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                        {t.due && (
                          <span className={`text-xs ${overdue ? 'font-medium text-red-500' : 'text-slate-400'}`}>
                            {overdue ? 'Overdue · ' : t.due === today ? 'Due today · ' : 'Due '}
                            {new Date(t.due + 'T00:00').toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => startEdit(t)} className="text-sm text-slate-400 hover:text-indigo-600">Edit</button>
                    <button onClick={() => remove([t.id])} className="text-sm text-slate-400 hover:text-red-500" aria-label="Delete">
                      Delete
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="py-8 text-center text-slate-400">
                  {loadingTodos ? 'Loading your tasks…' : todos.length === 0 ? 'Nothing yet — add your first task!' : 'No tasks in this view.'}
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

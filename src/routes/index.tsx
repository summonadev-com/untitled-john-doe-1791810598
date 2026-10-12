import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type Todo = { id: string; text: string; done: boolean; due: string };

function HomePage() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('todos') || '[]') as Todo[];
    } catch {
      return [];
    }
  });
  const [text, setText] = useState('');
  const [due, setDue] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const today = new Date().toISOString().slice(0, 10);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos([{ id: crypto.randomUUID(), text: text.trim(), done: false, due }, ...todos]);
    setText('');
    setDue('');
  }

  const sorted = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    return a.due ? -1 : b.due ? 1 : 0;
  });
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white px-4 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-800">My Tasks</h1>
        <p className="mb-6 text-slate-500">{remaining} task{remaining === 1 ? '' : 's'} left</p>

        <form onSubmit={add} className="mb-6 flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs doing?"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600"
          />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            Add
          </button>
        </form>

        <ul className="space-y-2">
          {sorted.map((t) => {
            const overdue = !t.done && t.due && t.due < today;
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                  className="h-5 w-5 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <p className={t.done ? 'text-slate-400 line-through' : 'text-slate-800'}>{t.text}</p>
                  {t.due && (
                    <p className={`text-xs ${overdue ? 'font-medium text-red-500' : 'text-slate-400'}`}>
                      {overdue ? 'Overdue · ' : 'Due '}
                      {new Date(t.due + 'T00:00').toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setTodos(todos.filter((x) => x.id !== t.id))}
                  className="text-slate-300 hover:text-red-500"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </li>
            );
          })}
          {todos.length === 0 && <li className="py-8 text-center text-slate-400">Nothing yet — add your first task!</li>}
        </ul>
      </div>
    </div>
  );
}

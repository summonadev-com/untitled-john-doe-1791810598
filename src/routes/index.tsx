import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type Priority = 'high' | 'medium' | 'low';
type Todo = { id: string; text: string; done: boolean; due: string; priority?: Priority };
type Filter = 'all' | 'active' | 'completed';

const PRIORITY_STYLE: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

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
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const today = new Date().toISOString().slice(0, 10);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos([{ id: crypto.randomUUID(), text: text.trim(), done: false, due, priority }, ...todos]);
    setText('');
    setDue('');
  }

  function startEdit(t: Todo) {
    setEditingId(t.id);
    setEditText(t.text);
    setEditDue(t.due);
    setEditPriority(t.priority ?? 'medium');
  }

  function saveEdit() {
    if (editText.trim()) {
      setTodos(todos.map((x) => (x.id === editingId ? { ...x, text: editText.trim(), due: editDue, priority: editPriority } : x)));
    }
    setEditingId(null);
  }

  const visible = todos
    .filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.done : t.done))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = PRIORITY_RANK[a.priority ?? 'medium'];
      const pb = PRIORITY_RANK[b.priority ?? 'medium'];
      if (pa !== pb) return pa - pb;
      if (a.due && b.due) return a.due.localeCompare(b.due);
      return a.due ? -1 : b.due ? 1 : 0;
    });
  const remaining = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - remaining;

  const inputCls = 'rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white px-4 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-800">My Tasks</h1>
        <p className="mb-6 text-slate-500">{remaining} task{remaining === 1 ? '' : 's'} left</p>

        <form onSubmit={add} className="mb-6 flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow">
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
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(['all', 'active', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-sm capitalize ${filter === f ? 'bg-white font-medium text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {doneCount > 0 && (
            <button onClick={() => setTodos(todos.filter((t) => !t.done))} className="text-sm text-slate-500 hover:text-red-500">
              Clear completed
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {visible.map((t) => {
            const overdue = !t.done && t.due && t.due < today;
            const p = t.priority ?? 'medium';
            if (editingId === t.id) {
              return (
                <li key={t.id} className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
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
                  <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">Cancel</button>
                </li>
              );
            }
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
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PRIORITY_STYLE[p]}`}>{p}</span>
                    {t.due && (
                      <span className={`text-xs ${overdue ? 'font-medium text-red-500' : 'text-slate-400'}`}>
                        {overdue ? 'Overdue · ' : t.due === today ? 'Due today · ' : 'Due '}
                        {new Date(t.due + 'T00:00').toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => startEdit(t)} className="text-sm text-slate-400 hover:text-indigo-600">Edit</button>
                <button onClick={() => setTodos(todos.filter((x) => x.id !== t.id))} className="text-slate-300 hover:text-red-500" aria-label="Delete">
                  ✕
                </button>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="py-8 text-center text-slate-400">
              {todos.length === 0 ? 'Nothing yet — add your first task!' : 'No tasks in this view.'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Check, Search, Filter, ChevronDown, ChevronRight,
  Clock, Calendar, Tag, Edit3, X, CheckCircle2, Circle, Loader2,
  ListTodo, Target, Timer, AlertTriangle, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tasksApi, Task } from '../services/api';
import { taskSchema, type TaskValues } from '../validation/schemas';

type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date';
type FilterStatus = 'all' | 'todo' | 'in-progress' | 'completed';
type FilterPriority = 'all' | 'low' | 'medium' | 'high';

const PRIORITY_CONFIG: Record<string, { color: string; border: string; bg: string; label: string }> = {
  high: { color: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/15', label: 'High' },
  medium: { color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/15', label: 'Medium' },
  low: { color: 'text-sky-400', border: 'border-sky-500/50', bg: 'bg-sky-500/15', label: 'Low' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Circle; label: string }> = {
  todo: { color: 'text-slate-400', bg: 'bg-slate-500/15', icon: Circle, label: 'To Do' },
  'in-progress': { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: Loader2, label: 'In Progress' },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle2, label: 'Done' },
};

const STATUS_CYCLE: Record<string, string> = { todo: 'in-progress', 'in-progress': 'completed', completed: 'todo' };

function getDueDateInfo(due: string | null) {
  if (!due) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(due); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'text-rose-400 bg-rose-500/15' };
  if (diff === 0) return { label: 'Today', cls: 'text-amber-400 bg-amber-500/15' };
  if (diff === 1) return { label: 'Tomorrow', cls: 'text-amber-300 bg-amber-500/10' };
  if (diff <= 7) return { label: `${diff}d left`, cls: 'text-sky-400 bg-sky-500/15' };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'text-slate-400 bg-slate-500/15' };
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', priority: 'medium', parent_id: undefined, description: '', due_date: '' },
  });

  const load = useCallback(async () => {
    try { const { data } = await tasksApi.getAll(); setTasks(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived data
  const roots = useMemo(() => tasks.filter(t => !t.parent_id), [tasks]);
  const childrenOf = useCallback((pid: number) => tasks.filter(t => t.parent_id === pid), [tasks]);

  const filtered = useMemo(() => {
    let list = roots;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus);
    if (filterPriority !== 'all') list = list.filter(t => t.priority === filterPriority);

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority': return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
        case 'due_date': return (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [roots, search, filterStatus, filterPriority, sort]);

  // Stats
  const stats = useMemo(() => {
    const total = roots.length;
    const completed = roots.filter(t => t.status === 'completed').length;
    const inProgress = roots.filter(t => t.status === 'in-progress').length;
    const estMin = roots.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    return { total, completed, inProgress, estMin, pct: total ? Math.round((completed / total) * 100) : 0 };
  }, [roots]);

  async function handleAdd(values: TaskValues) {
    await tasksApi.create({
      title: values.title.trim(),
      priority: values.priority,
      parent_id: values.parent_id as number | undefined,
      description: values.description,
      estimated_minutes: values.estimated_minutes,
      due_date: values.due_date,
    });
    reset({ title: '', priority: 'medium', parent_id: undefined, description: '', due_date: '' });
    setShowForm(false);
    load();
  }

  async function toggleStatus(task: Task) {
    await tasksApi.update(task.id, { status: STATUS_CYCLE[task.status] || 'todo' });
    load();
  }

  async function deleteTask(id: number) {
    await tasksApi.delete(id); load();
  }

  async function saveTitle(id: number) {
    if (editTitle.trim()) await tasksApi.update(id, { title: editTitle.trim() });
    setEditingId(null); load();
  }

  function toggleSelect(id: number) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function bulkComplete() {
    await tasksApi.bulkAction([...selected], 'complete'); setSelected(new Set()); load();
  }
  async function bulkDelete() {
    await tasksApi.bulkAction([...selected], 'delete'); setSelected(new Set()); load();
  }

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Completed', value: `${stats.completed} (${stats.pct}%)`, icon: Target, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'In Progress', value: stats.inProgress, icon: Sparkles, gradient: 'from-amber-500 to-orange-600' },
    { label: 'Est. Time', value: stats.estMin >= 60 ? `${Math.floor(stats.estMin / 60)}h ${stats.estMin % 60}m` : `${stats.estMin}m`, icon: Timer, gradient: 'from-purple-500 to-pink-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl space-y-6 px-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Tasks</h1>
          <p className="text-text-muted text-sm mt-1">Manage your tasks and stay on track</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(f => !f)}>
          {showForm ? <><X className="h-5 w-5" /> Cancel</> : <><Plus className="h-5 w-5" /> New Task</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, gradient }) => (
          <motion.div key={label} whileHover={{ scale: 1.02 }} className="card group">
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${gradient} p-2.5 mb-2 text-white group-hover:scale-110 transition-transform`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-xl font-bold text-text">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit(handleAdd)} className="card space-y-4 overflow-hidden" noValidate
          >
            <h3 className="text-lg font-semibold text-text">Create New Task</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input className="input-field" placeholder="Task title *" {...register('title')} />
                {errors.title && <p className="mt-1 text-sm text-red-400" role="alert">{errors.title.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <textarea className="input-field resize-none" rows={2} placeholder="Description (optional)" {...register('description')} />
              </div>
              <select className="input-field" {...register('priority')}>
                <option value="low">🟦 Low Priority</option>
                <option value="medium">🟨 Medium Priority</option>
                <option value="high">🟥 High Priority</option>
              </select>
              <input type="number" className="input-field" placeholder="Estimated minutes" min={1} {...register('estimated_minutes', { valueAsNumber: true })} />
              <input type="date" className="input-field" {...register('due_date')} />
              <select className="input-field" {...register('parent_id', { setValueAs: v => v ? Number(v) : undefined })}>
                <option value="">Top-level task</option>
                {roots.map(t => <option key={t.id} value={t.id}>↳ Subtask of: {t.title}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); reset(); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
          <input className="input-field pl-10" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input-field w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}>
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select className="input-field w-auto text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value as FilterPriority)}>
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="input-field w-auto text-sm" value={sort} onChange={e => setSort(e.target.value as SortOption)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
            <option value="due_date">Due Date</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
          >
            <span className="text-sm font-medium text-primary-light">{selected.size} selected</span>
            <div className="flex-1" />
            <button type="button" onClick={bulkComplete} className="btn-ghost text-sm text-emerald-400 hover:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Complete
            </button>
            <button type="button" onClick={bulkDelete} className="btn-ghost text-sm text-rose-400 hover:text-rose-300">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="btn-ghost text-sm">
              <X className="h-4 w-4" /> Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-text-muted">Loading tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 gap-4">
          <div className="rounded-full bg-surface p-6"><ListTodo className="h-12 w-12 text-text-subtle" /></div>
          <h3 className="text-xl font-semibold text-text">No tasks found</h3>
          <p className="text-text-muted text-center max-w-sm">
            {search || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Create your first task to get started!'}
          </p>
          {!showForm && !search && filterStatus === 'all' && (
            <button type="button" className="btn-primary mt-2" onClick={() => setShowForm(true)}>
              <Plus className="h-5 w-5" /> Create Task
            </button>
          )}
        </motion.div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(task => {
              const subs = childrenOf(task.id);
              const subsDone = subs.filter(s => s.status === 'completed').length;
              const isExpanded = expandedId === task.id;
              const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
              const StIcon = st.icon;
              const dueInfo = getDueDateInfo(task.due_date);

              return (
                <motion.li key={task.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <div className={`card border-l-4 ${pri.border} !p-0 overflow-hidden`}>
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                      {/* Select checkbox */}
                      <input type="checkbox" checked={selected.has(task.id)} onChange={() => toggleSelect(task.id)}
                        className="h-4 w-4 rounded border-border bg-slate-800 text-primary accent-primary cursor-pointer shrink-0" />

                      {/* Status button */}
                      <button type="button" onClick={() => toggleStatus(task)}
                        title={`Status: ${st.label}. Click to change.`}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${st.bg} ${st.color} hover:scale-110`}
                      >
                        <StIcon className={`h-4 w-4 ${task.status === 'in-progress' ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        {editingId === task.id ? (
                          <div className="flex gap-2">
                            <input className="input-field py-1 text-sm flex-1" value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveTitle(task.id); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus />
                            <button type="button" onClick={() => saveTitle(task.id)} className="btn-ghost p-1 text-emerald-400"><Check className="h-4 w-4" /></button>
                            <button type="button" onClick={() => setEditingId(null)} className="btn-ghost p-1 text-slate-400"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <p className={`font-medium truncate cursor-pointer hover:text-primary transition-colors ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-text'}`}
                            onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                            title="Click to edit"
                          >{task.title}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>
                            {pri.label}
                          </span>
                          {task.estimated_minutes > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                              <Clock className="h-3 w-3" /> {task.estimated_minutes}m
                            </span>
                          )}
                          {dueInfo && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${dueInfo.cls}`}>
                              <Calendar className="h-3 w-3" /> {dueInfo.label}
                            </span>
                          )}
                          {subs.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                              {subsDone}/{subs.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : task.id)}
                          className="btn-icon" title="Details">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                          className="btn-icon" title="Edit"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => deleteTask(task.id)}
                          className="btn-icon text-slate-500 hover:text-rose-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {/* Subtask progress bar */}
                    {subs.length > 0 && (
                      <div className="px-5 pb-1">
                        <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            initial={{ width: 0 }} animate={{ width: `${(subsDone / subs.length) * 100}%` }} transition={{ duration: 0.5 }} />
                        </div>
                      </div>
                    )}

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-5 py-4 space-y-3 bg-slate-900/30">
                            {task.description && (
                              <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Description</p>
                                <p className="text-sm text-text-secondary">{task.description}</p>
                              </div>
                            )}
                            {task.notes && (
                              <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-sm text-text-secondary">{task.notes}</p>
                              </div>
                            )}
                            {task.tags.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {task.tags.map(tag => (
                                  <span key={tag} className="badge-primary text-xs"><Tag className="h-3 w-3" /> {tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-text-subtle">
                              <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                              <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
                              {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                            </div>

                            {/* Subtasks */}
                            {subs.length > 0 && (
                              <div className="pt-2">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Subtasks</p>
                                <ul className="space-y-2">
                                  {subs.map(sub => {
                                    const subSt = STATUS_CONFIG[sub.status] || STATUS_CONFIG.todo;
                                    const SubIcon = subSt.icon;
                                    return (
                                      <li key={sub.id} className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2">
                                        <button type="button" onClick={() => toggleStatus(sub)}
                                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${subSt.bg} ${subSt.color} hover:scale-110 transition`}
                                        >
                                          <SubIcon className={`h-3.5 w-3.5 ${sub.status === 'in-progress' ? 'animate-spin' : ''}`} />
                                        </button>
                                        <span className={`flex-1 text-sm truncate ${sub.status === 'completed' ? 'line-through text-slate-500' : 'text-text-secondary'}`}>{sub.title}</span>
                                        <button type="button" onClick={() => deleteTask(sub.id)} className="text-slate-600 hover:text-rose-400 transition">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}

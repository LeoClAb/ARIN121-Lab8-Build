/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';

type TimerMode = 'focus' | 'short' | 'long';
type TaskFilter = 'all' | 'active' | 'completed';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const MODE_CONFIG: Record<TimerMode, { label: string; seconds: number }> = {
  focus: { label: 'Focus', seconds: 25 * 60 },
  short: { label: 'Short Break', seconds: 5 * 60 },
  long: { label: 'Long Break', seconds: 15 * 60 },
};

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Outline Q4 product roadmap milestones',
    completed: true,
    createdAt: '09:15',
  },
  {
    id: 't-2',
    title: 'Review pull requests for API rate limiting',
    completed: false,
    createdAt: '09:40',
  },
  {
    id: 't-3',
    title: 'Draft release notes for v2.4 update',
    completed: false,
    createdAt: '10:05',
  },
];

const STORAGE_KEY = 'cadence_tasks_v1';

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(MODE_CONFIG.focus.seconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Ignore storage errors
    }
  }, [tasks]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'focus') {
            setSessionsCompleted((count) => count + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, mode]);

  const handleModeChange = (nextMode: TimerMode) => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(MODE_CONFIG[nextMode].seconds);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(MODE_CONFIG[mode].seconds);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const item: Task = {
      id: `t-${Date.now()}`,
      title: trimmed,
      completed: false,
      createdAt: timeLabel,
    };
    setTasks((prev) => [item, ...prev]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (searchQuery.trim()) {
        return task.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [tasks, filter, searchQuery]);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.length - activeCount;
  const progressPercent = Math.round(
    ((MODE_CONFIG[mode].seconds - secondsLeft) / MODE_CONFIG[mode].seconds) * 100
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Cadence
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#timer"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Focus Timer
            </a>
            <a
              href="#tasks"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Task Queue
            </a>
            <a
              href="#summary"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Daily Summary
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Daily Focus Workspace
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Timebox deep work intervals and track today&apos;s deliverables in one view.
            </p>
          </div>
          <div id="summary" className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
            <span>{activeCount} remaining</span>
            <span aria-hidden="true">·</span>
            <span>{completedCount} completed</span>
            <span aria-hidden="true">·</span>
            <span>{sessionsCompleted} sessions logged</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Focus Timer Panel */}
          <section
            id="timer"
            aria-label="Focus Timer"
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Session Timer</h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {progressPercent}% elapsed
              </span>
            </div>

            {/* Segmented Mode Selector */}
            <div
              role="tablist"
              aria-label="Timer Mode"
              className="mt-5 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {(Object.keys(MODE_CONFIG) as TimerMode[]).map((key) => {
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleModeChange(key)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {MODE_CONFIG[key].label}
                  </button>
                );
              })}
            </div>

            {/* Countdown Readout */}
            <div className="my-10 text-center">
              <div
                aria-live="polite"
                className="text-6xl font-mono font-semibold tracking-tight text-slate-900 tabular-nums"
              >
                {formatClock(secondsLeft)}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {isRunning
                  ? `${MODE_CONFIG[mode].label} interval in progress`
                  : `${MODE_CONFIG[mode].label} interval ready`}
              </p>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-blue-600 transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* Primary Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" />
                    <span>Start</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetTimer}
                aria-label="Reset timer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </section>

          {/* Task Queue Panel */}
          <section
            id="tasks"
            aria-label="Task Queue"
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Task Queue</h2>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                {(['all', 'active', 'completed'] as TaskFilter[]).map((tab) => {
                  const active = filter === tab;
                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="mt-5 flex items-center gap-3">
              <label htmlFor="new-task-input" className="sr-only">
                Add a new task
              </label>
              <input
                ref={inputRef}
                id="new-task-input"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task for this focus block..."
                className="flex-1 min-w-0 h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Add Task
              </button>
            </form>

            {/* Search Filter */}
            {tasks.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks..."
                  aria-label="Filter tasks"
                  className="w-full sm:w-64 h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                />
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Clear completed
                  </button>
                )}
              </div>
            )}

            {/* Task List */}
            <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {tasks.length === 0
                      ? 'No tasks queued yet'
                      : 'No tasks match the current filter'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tasks.length === 0
                      ? 'Add your first deliverable above to begin.'
                      : 'Try clearing the search query or switching tabs.'}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-4 group hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={
                          task.completed
                            ? `Mark "${task.title}" as incomplete`
                            : `Mark "${task.title}" as complete`
                        }
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          task.completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 hover:border-blue-600'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>

                      <span
                        className={`text-sm truncate ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        {task.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label={`Delete "${task.title}"`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

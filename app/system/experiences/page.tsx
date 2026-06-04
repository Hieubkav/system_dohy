'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  Loader2,
  Mail,
  Menu as MenuIcon,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { Card, CardContent, Input } from '@/app/admin/components/ui';
import { api } from '@/convex/_generated/api';
import { useI18n } from '../i18n/context';

type ExperienceGroup = 'content' | 'commerce' | 'user' | 'ui' | null;

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  Mail,
  Menu: MenuIcon,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Ticket,
  User,
};

type GroupConfig = {
  id: ExperienceGroup;
  label: string;
  color: string;
  activeClass: string;
  dotClass: string;
};

const GROUPS: GroupConfig[] = [
  { id: null,       label: 'Tất cả',      color: '#06b6d4', activeClass: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',           dotClass: 'bg-slate-400' },
  { id: 'content',  label: 'Nội dung',    color: '#06b6d4', activeClass: 'bg-cyan-500 text-white',    dotClass: 'bg-cyan-500' },
  { id: 'commerce', label: 'Thương mại',  color: '#7c3aed', activeClass: 'bg-violet-600 text-white',  dotClass: 'bg-violet-500' },
  { id: 'user',     label: 'Người dùng',  color: '#d97706', activeClass: 'bg-amber-500 text-white',   dotClass: 'bg-amber-400' },
  { id: 'ui',       label: 'Giao diện',   color: '#e11d48', activeClass: 'bg-rose-500 text-white',    dotClass: 'bg-rose-500' },
];

const GROUP_ICON_COLOR: Record<string, string> = {
  content:  'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400',
  commerce: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
  user:     'text-amber-600 bg-amber-500/10 dark:text-amber-400',
  ui:       'text-rose-600 bg-rose-500/10 dark:text-rose-400',
};

const GROUP_HOVER_COLOR: Record<string, string> = {
  content:  'hover:border-cyan-500/60 group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  commerce: 'hover:border-violet-500/60 group-hover:text-violet-600 dark:group-hover:text-violet-400',
  user:     'hover:border-amber-500/60 group-hover:text-amber-600 dark:group-hover:text-amber-400',
  ui:       'hover:border-rose-500/60 group-hover:text-rose-600 dark:group-hover:text-rose-400',
};

export default function ExperiencesPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<ExperienceGroup>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const experiences = useQuery(api.experiences.search, {
    group: activeGroup ?? undefined,
    query: debouncedQuery,
  });

  // Count per group (all experiences, no filter)
  const allExperiences = useQuery(api.experiences.search, { query: '' });
  const countByGroup = React.useMemo(() => {
    if (!allExperiences) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: allExperiences.length };
    for (const exp of allExperiences) {
      counts[exp.group] = (counts[exp.group] ?? 0) + 1;
    }
    return counts;
  }, [allExperiences]);

  const handleGroupChange = useCallback((group: ExperienceGroup) => {
    setActiveGroup(group);
    setSearchQuery('');
  }, []);

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-cyan-500 inline-block" />
              {t.pages.experiences}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấu hình theo trải nghiệm người dùng, dễ quan sát và mở rộng.
          </p>
        </div>

        {/* Search — Ctrl+K */}
        <div className="relative w-full sm:w-72 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          </div>
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh..."
            className="pl-9 pr-16 h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500 dark:focus-visible:border-cyan-400 transition-all rounded-lg text-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                ⌘K
              </kbd>
            </span>
          )}
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((group) => {
          const count = group.id === null ? countByGroup.all : countByGroup[group.id];
          const isActive = activeGroup === group.id;
          return (
            <button
              key={String(group.id)}
              type="button"
              onClick={() => handleGroupChange(group.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? group.activeClass
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {!isActive && <span className={`w-2 h-2 rounded-full ${group.dotClass}`} />}
              {group.label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {experiences === undefined ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
        </div>
      ) : experiences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {debouncedQuery
              ? <>Không có kết quả cho &ldquo;<strong>{debouncedQuery}</strong>&rdquo;</>
              : 'Nhóm này chưa có trải nghiệm nào.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {experiences.map((exp) => {
            const Icon = iconMap[exp.icon] || FileText;
            const iconColorClass = GROUP_ICON_COLOR[exp.group] ?? GROUP_ICON_COLOR.content;
            const hoverColorClass = GROUP_HOVER_COLOR[exp.group] ?? GROUP_HOVER_COLOR.content;
            return (
              <Link key={exp.href} href={exp.href} className="group">
                <Card className={`border border-slate-200 dark:border-slate-800 ${hoverColorClass} hover:shadow-sm transition-all duration-200 rounded-xl h-full`}>
                  <CardContent className="p-3.5 flex gap-3 items-start h-full">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0 ${iconColorClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className={`font-semibold text-slate-800 dark:text-slate-100 transition-colors text-sm leading-snug`}>
                        {exp.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {experiences !== undefined && experiences.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-600 text-right pb-4">
          {experiences.length} trải nghiệm{activeGroup ? ` trong nhóm này` : ''}
          {debouncedQuery ? ` khớp "${debouncedQuery}"` : ''}
        </p>
      )}
    </div>
  );
}

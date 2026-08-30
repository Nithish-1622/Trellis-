import React, { useState } from 'react';
import { ResourceItem } from '../types';
import {
  BookOpen,
  Sparkles,
  Search,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import ModalCards from './ModalCards';

interface ResourcesViewProps {
  resources: ResourceItem[];
  onToggleBookmark: (resId: string) => void;
  onResourceFeedback: (resId: string, action: 'up' | 'down' | 'regen') => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  onToggleBookmark,
  onResourceFeedback
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterSavedOnly, setFilterSavedOnly] = useState<boolean>(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const categories = ['All', 'Architecture', 'Ingress & Gateways', 'Security & Mesh', 'Data Engineering', 'Distributed Databases'];

  const filteredResources = resources.filter(res => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || res.category === selectedCategory;

    const matchesSaved = !filterSavedOnly || res.bookmarked;

    return matchesSearch && matchesCategory && matchesSaved;
  });

  const handleFeedback = (resId: string, action: 'up' | 'down' | 'regen') => {
    if (action === 'regen') {
      setRegeneratingId(resId);
      setTimeout(() => {
        setRegeneratingId(null);
        onResourceFeedback(resId, action);
      }, 700);
    } else {
      onResourceFeedback(resId, action);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>AI Knowledge Library</span>
          </span>
          <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Architecture Learning Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Continuously calibrated courses, deep-dive RFC breakdowns, and hands-on kata projects tailored to your Trellis radar gaps.
          </p>
        </div>

        {/* Saved filter toggle */}
        <button
          onClick={() => setFilterSavedOnly(!filterSavedOnly)}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 relative z-10 cursor-pointer ${
            filterSavedOnly
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-transparent shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{filterSavedOnly ? 'Showing Saved Only' : 'Saved Bookmarks'}</span>
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search keyword, Kafka, Envoy, Raft, mTLS..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Category Pill Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Card Grid — Powered by Expandable ModalCards */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-literata text-base font-bold text-slate-700 dark:text-slate-300">
            No matching resources found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting the category filter to view all recommendations.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setFilterSavedOnly(false);
            }}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ModalCards
          resources={filteredResources}
          onToggleBookmark={onToggleBookmark}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
};

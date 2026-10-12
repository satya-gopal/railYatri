import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, X, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AutocompleteItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
}

export interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  items: AutocompleteItem[];
  value: string; // id or title
  onChange: (item: AutocompleteItem) => void;
  error?: string;
  className?: string;
}

interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  placeholder = 'Search...',
  items,
  value,
  onChange,
  error,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query with current selected item
  useEffect(() => {
    const selected = items.find((i) => i.id === value || i.title === value);
    if (selected) {
      setQuery(`${selected.title} (${selected.id})`);
    } else if (value) {
      setQuery(value);
    }
  }, [value, items]);

  // Calculate dropdown position from the input element
  const updateDropdownRect = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownRect();

    const handleScrollResize = () => updateDropdownRect();
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
    return () => {
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isOpen, updateDropdownRect]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const portalEl = document.getElementById('autocomplete-portal');
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        portalEl &&
        !portalEl.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q))
        );
      })
    : items.slice(0, 8); // show top 8 stations when empty

  const handleSelect = (item: AutocompleteItem) => {
    setQuery(`${item.title} (${item.id})`);
    onChange(item);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        updateDropdownRect();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        handleSelect(filteredItems[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // The dropdown rendered via a portal so it escapes any parent overflow/clip
  const dropdown =
    isOpen && dropdownRect
      ? ReactDOM.createPortal(
          <div
            id="autocomplete-portal"
            style={{
              position: 'absolute',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 py-1"
          >
            {filteredItems.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                No matching stations found
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      // Use mousedown + preventDefault to prevent input blur before select
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-sm transition-colors',
                      isHighlighted
                        ? 'bg-primary-50 text-primary-900 dark:bg-primary-950/60 dark:text-primary-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold">{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 truncate">
                            • {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.id}
                    </span>
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            updateDropdownRect();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
            updateDropdownRect();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded-xl border bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 transition-colors',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
            error ? 'border-danger-500' : 'border-slate-300 dark:border-slate-700'
          )}
        />

        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              setIsOpen(true);
              updateDropdownRect();
            }}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-500 font-medium">{error}</p>}

      {dropdown}
    </div>
  );
};

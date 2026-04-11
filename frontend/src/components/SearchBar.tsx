import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Search, X, FileText, Loader2 } from 'lucide-react';

export function SearchBar() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const { searchFiles, searchResults, isSearching, setSearchQuery } = useFileStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [sel, setSel] = useState(-1);

  const update = useCallback((v: string) => {
    setQuery(v); setSearchQuery(v); setSel(-1);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => searchFiles(v), 250);
  }, [searchFiles, setSearchQuery]);

  const clear = () => { setQuery(''); setSearchQuery(''); searchFiles(''); inputRef.current?.focus(); };

  const select = (id: string) => {
    const el = document.querySelector(`[data-file-id="${id}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    setFocused(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSel(i => Math.min(i + 1, searchResults.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSel(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && sel >= 0) select(searchResults[sel].id);
    if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
  };

  // Ctrl+K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // Click outside
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const dropdown = focused && query.trim().length > 0;

  return (
    <div className="relative w-full" ref={wrapRef}>
      <div className={`flex items-center gap-2 h-8 px-2.5 rounded-md border transition-colors
        ${focused ? 'border-v-accent bg-v-accent/[0.04]' : 'border-v-border bg-v-surface hover:border-v-border-l'}`}>
        {isSearching
          ? <Loader2 size={13} className="text-v-accent animate-spin flex-shrink-0" />
          : <Search size={13} className={`flex-shrink-0 ${focused ? 'text-v-accent' : 'text-v-t3'}`} />}
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={e => update(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKey}
          className="flex-1 bg-transparent border-none outline-none text-[12px] text-v-t1 placeholder-v-t3 min-w-0"
        />
        {query ? (
          <button onClick={clear} className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors p-0.5"><X size={12} /></button>
        ) : !focused && (
          <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] text-v-t3 border border-v-border bg-v-bg px-1.5 py-0.5 rounded">⌘K</kbd>
        )}
      </div>

      {dropdown && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full surface-overlay rounded-lg shadow-xl z-[100] overflow-hidden anim-scale origin-top">
          {searchResults.length === 0 ? (
            <p className="p-4 text-[12px] text-v-t3 text-center">Aucun résultat</p>
          ) : (
            <div className="max-h-[240px] overflow-y-auto scroll-thin py-1">
              {searchResults.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => select(f.id)}
                  onMouseEnter={() => setSel(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                    ${i === sel ? 'bg-v-accent/10 text-v-t1' : 'text-v-t2 hover:bg-v-surface'}`}
                >
                  <FileText size={13} className={i === sel ? 'text-v-accent' : 'text-v-t3'} />
                  <span className="flex-1 truncate text-[12px] font-medium">{f.name}</span>
                  <span className="text-[10px] font-mono text-v-t3">{(f.size / 1024).toFixed(0)} KB</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

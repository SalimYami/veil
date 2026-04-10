import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Search, X, FileText, Loader2, Command } from 'lucide-react';

export function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const { searchFiles, searchResults, isSearching, setSearchQuery } = useFileStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleChange = useCallback((value: string) => {
    setLocalQuery(value);
    setSearchQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFiles(value), 300);
  }, [searchFiles, setSearchQuery]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    searchFiles('');
    inputRef.current?.focus();
  };

  const handleSelect = (fileId: string) => {
    const card = document.querySelector(`[data-file-id="${fileId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-accent', 'transition-all', 'duration-300');
      setTimeout(() => card.classList.remove('ring-accent'), 2000);
    }
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && selectedIndex >= 0) handleSelect(searchResults[selectedIndex].id);
    else if (e.key === 'Escape') { setIsFocused(false); inputRef.current?.blur(); }
  };

  // Global shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = isFocused && localQuery.trim().length > 0;
  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input */}
      <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
        ${isFocused
          ? 'border-v-accent/40 bg-[rgba(99,102,241,0.05)] shadow-[0_0_0_2px_rgba(99,102,241,0.12)]'
          : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.12)]'
        }`}
      >
        {isSearching
          ? <Loader2 size={14} className="text-v-accent animate-spin flex-shrink-0" />
          : <Search size={14} className={`flex-shrink-0 transition-colors ${isFocused ? 'text-v-accent' : 'text-v-t3'}`} />
        }
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher un fichier..."
          value={localQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-v-t1 text-sm placeholder-v-t3 min-w-0"
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {localQuery && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md text-v-t3 hover:text-v-t1 hover:bg-white/10 transition-colors cursor-pointer animate-fade-in"
            >
              <X size={12} />
            </button>
          )}
          {!localQuery && !isFocused && (
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]">
              <Command size={9} className="text-v-t3" />
              <span className="text-[9px] font-mono text-v-t3">K</span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full glass-heavy rounded-2xl shadow-2xl overflow-hidden z-[100] animate-scale-in origin-top">
          {searchResults.length === 0 ? (
            <div className="p-5 text-center">
              <Search size={20} className="text-v-t3 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-v-t3 italic">Aucun résultat pour « {localQuery} »</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scroll p-1.5 flex flex-col gap-0.5">
              <p className="text-[9px] font-mono text-v-t3 uppercase tracking-widest px-3 py-1">
                {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
              </p>
              {searchResults.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => handleSelect(file.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer
                    ${index === selectedIndex
                      ? 'bg-v-accent/15 border-l-2 border-v-accent'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center
                    ${index === selectedIndex
                      ? 'bg-v-accent/15 text-v-accent border-v-accent/25'
                      : 'bg-[rgba(255,255,255,0.03)] text-v-t3 border-[rgba(255,255,255,0.07)]'
                    }`}
                  >
                    <FileText size={13} />
                  </div>
                  <span className={`flex-1 truncate text-sm font-medium transition-colors ${index === selectedIndex ? 'text-white' : 'text-v-t2'}`}>
                    {file.name}
                  </span>
                  <span className="text-[10px] font-mono text-v-t3 flex-shrink-0">{formatSize(file.size)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

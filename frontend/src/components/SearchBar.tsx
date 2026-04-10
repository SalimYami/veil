import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Search, X, FileText, Loader2 } from 'lucide-react';

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
        debounceRef.current = setTimeout(() => {
            searchFiles(value);
        }, 300);
    }, [searchFiles, setSearchQuery]);

    const handleClear = () => {
        setLocalQuery('');
        setSearchQuery('');
        searchFiles('');
        inputRef.current?.focus();
    };

    const handleSelect = (fileId: string) => {
        // Scroll to file card and highlight it
        const card = document.querySelector(`[data-file-id="${fileId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-2', 'ring-vault-primary', 'shadow-[0_0_20px_rgba(37,99,235,0.3)]', 'transition-all', 'duration-300');
            setTimeout(() => card.classList.remove('ring-2', 'ring-vault-primary', 'shadow-[0_0_20px_rgba(37,99,235,0.3)]'), 2000);
        }
        setIsFocused(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            handleSelect(searchResults[selectedIndex].id);
        } else if (e.key === 'Escape') {
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    // Close dropdown on outside click
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

    return (
        <div className="relative w-full max-w-lg m-0 p-0" ref={dropdownRef}>
            <div className={`relative flex items-center bg-vault-bg-tertiary border border-white/5 rounded-full px-4 transition-all duration-300 shadow-inner overflow-hidden ${isFocused ? 'ring-1 ring-vault-primary/50 shadow-[0_0_15px_rgba(37,99,235,0.15)] bg-vault-bg-secondary' : 'hover:border-white/10 hover:bg-white/5'}`}>
                <Search size={16} className={`flex-shrink-0 transition-colors duration-300 ${isFocused ? 'text-vault-primary' : 'text-vault-text-muted'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Rechercher un fichier..."
                    value={localQuery}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none text-white text-sm py-2 px-3 outline-none placeholder-vault-text-muted/60 min-w-0"
                />
                
                <div className="flex items-center gap-1 flex-shrink-0">
                    {localQuery && (
                        <button className="p-1 hover:bg-white/10 rounded-full text-vault-text-muted hover:text-white transition-colors animate-[fadeIn_0.2s_ease-out]" onClick={handleClear} title="Effacer">
                            <X size={14} />
                        </button>
                    )}
                    {isSearching && <Loader2 size={14} className="text-vault-primary animate-spin" />}
                </div>
            </div>

            {showDropdown && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-vault-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-[scaleIn_0.2s_ease-out_forwards] origin-top">
                    {searchResults.length === 0 ? (
                        <div className="p-4 text-center text-sm text-vault-text-muted italic">Aucun résultat pour "{localQuery}"</div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col p-1.5">
                            {searchResults.map((file, index) => (
                                <button
                                    key={file.id}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors font-sans group ${index === selectedIndex ? 'bg-vault-primary/20 text-white shadow-[inset_2px_0_0_var(--color-vault-primary)]' : 'hover:bg-white/5 text-white/80 hover:text-white'}`}
                                    onClick={() => handleSelect(file.id)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={`p-1.5 rounded-lg border transition-colors ${index === selectedIndex ? 'bg-vault-primary/20 text-vault-primary border-vault-primary/30' : 'bg-vault-bg-primary text-vault-text-muted border-white/5 group-hover:border-white/10 group-hover:text-vault-text-secondary'}`}>
                                        <FileText size={14} />
                                    </div>
                                    <span className="flex-1 truncate text-sm font-medium">{file.name}</span>
                                    <span className={`text-[0.65rem] font-mono whitespace-nowrap transition-colors ${index === selectedIndex ? 'text-vault-primary' : 'text-vault-text-muted/60 group-hover:text-vault-text-muted'}`}>
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

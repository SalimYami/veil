import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { Search, X, FileText, Loader2 } from 'lucide-react';

export function SearchBar() {
    const [isFocused, setIsFocused] = useState(false);
    const [localQuery, setLocalQuery] = useState('');
    const { searchFiles, searchResults, isSearching, setSearchQuery } = useFileStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
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
            card.classList.add('file-card-highlight');
            setTimeout(() => card.classList.remove('file-card-highlight'), 2000);
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
        <div className="search-bar-container" ref={dropdownRef}>
            <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
                <Search size={16} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Rechercher un fichier..."
                    value={localQuery}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                />
                {localQuery && (
                    <button className="search-clear" onClick={handleClear}>
                        <X size={14} />
                    </button>
                )}
                {isSearching && <Loader2 size={14} className="spinner search-spinner" />}
            </div>

            {showDropdown && (
                <div className="search-dropdown">
                    {searchResults.length === 0 ? (
                        <div className="search-empty">Aucun résultat pour "{localQuery}"</div>
                    ) : (
                        searchResults.map((file, index) => (
                            <button
                                key={file.id}
                                className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleSelect(file.id)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <FileText size={14} />
                                <span className="search-result-name">{file.name}</span>
                                <span className="search-result-size">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

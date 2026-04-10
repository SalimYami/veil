import { useState, useRef, useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Tag, X, Plus } from 'lucide-react';

interface TagModalProps {
    fileId: string;
    fileName: string;
    currentTags: string[];
    onClose: () => void;
}

export function TagModal({ fileId, fileName, currentTags, onClose }: TagModalProps) {
    const [tags, setTags] = useState<string[]>(currentTags || []);
    const [newTag, setNewTag] = useState('');
    const { updateFileTags, allTags } = useFileStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleAddTag = () => {
        const cleaned = newTag.trim().toLowerCase();
        if (cleaned && !tags.includes(cleaned)) {
            const updated = [...tags, cleaned];
            setTags(updated);
            setNewTag('');
            inputRef.current?.focus();
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSave = async () => {
        await updateFileTags(fileId, tags);
        onClose();
    };

    // Suggestions: existing tags not yet applied
    const suggestions = allTags.filter(t => !tags.includes(t)).slice(0, 5); // Limit suggestions

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-vault-bg-primary/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-vault-bg-secondary border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]" ref={modalRef}>
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-vault-bg-tertiary">
                    <h3 className="font-semibold text-white/90 flex items-center gap-2 text-sm truncate max-w-[85%]">
                        <Tag size={16} className="text-vault-primary flex-shrink-0" />
                        <span className="truncate">Tags — {fileName}</span>
                    </h3>
                    <button className="p-1 text-vault-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Current tags */}
                    <div className="flex flex-wrap gap-2 min-h-[32px] p-3 bg-vault-bg-tertiary/50 border border-white/5 rounded-xl shadow-inner">
                        {tags.length === 0 && (
                            <span className="text-sm text-vault-text-muted italic flex items-center justify-center w-full">Aucun tag</span>
                        )}
                        {tags.map(tag => (
                            <span key={tag} className="group flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium font-mono uppercase tracking-wider text-vault-primary bg-vault-primary/10 border border-vault-primary/20 rounded-lg transition-colors">
                                {tag}
                                <button className="p-0.5 rounded-full hover:bg-vault-primary/20 text-vault-primary/70 hover:text-vault-primary transition-colors focus:outline-none" onClick={() => handleRemoveTag(tag)}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Add new tag */}
                    <div className="relative flex items-center focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.2)] rounded-xl transition-shadow bg-vault-bg-primary border border-white/10">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Nouveau tag (ex: facture, dev)"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={30}
                            className="bg-transparent border-none outline-none w-full py-2.5 px-4 text-sm text-white placeholder-vault-text-muted/60"
                        />
                        <button 
                            className="absolute right-1 p-1.5 bg-vault-primary text-white rounded-lg hover:bg-vault-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                            onClick={handleAddTag} 
                            disabled={!newTag.trim()}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            <span className="text-xs text-vault-text-muted w-full mb-1">Suggestions :</span>
                            {suggestions.map(tag => (
                                <button
                                    key={tag}
                                    className="px-2 py-1 text-xs font-mono text-vault-text-secondary bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-md transition-colors flex items-center gap-1"
                                    onClick={() => {
                                        if (!tags.includes(tag)) {
                                            setTags([...tags, tag]);
                                            inputRef.current?.focus();
                                        }
                                    }}
                                >
                                    <Plus size={10} className="opacity-50" /> {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 bg-vault-bg-tertiary flex justify-end gap-3 border-t border-white/5">
                    <button className="px-4 py-2 bg-transparent text-vault-text-secondary hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors" onClick={onClose}>Annuler</button>
                    <button className="px-4 py-2 bg-vault-primary text-white border border-vault-primary hover:bg-vault-primary-hover hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] rounded-lg text-sm font-medium transition-all" onClick={handleSave}>Enregistrer</button>
                </div>
            </div>
        </div>
    );
}

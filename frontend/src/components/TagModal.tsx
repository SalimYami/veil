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
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
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
    const suggestions = allTags.filter(t => !tags.includes(t));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="tag-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
                <div className="tag-modal-header">
                    <div className="tag-modal-title">
                        <Tag size={16} />
                        <span>Tags — {fileName}</span>
                    </div>
                    <button className="close-modal" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="tag-modal-body">
                    {/* Current tags */}
                    <div className="tag-modal-current">
                        {tags.length === 0 && (
                            <span className="tag-modal-empty">Aucun tag</span>
                        )}
                        {tags.map(tag => (
                            <span key={tag} className="tag-chip">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Add new tag */}
                    <div className="tag-modal-input">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Nouveau tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={30}
                        />
                        <button className="tag-add-btn" onClick={handleAddTag} disabled={!newTag.trim()}>
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="tag-suggestions">
                            <span className="tag-suggestions-label">Suggestions :</span>
                            {suggestions.map(tag => (
                                <button
                                    key={tag}
                                    className="tag-suggestion"
                                    onClick={() => {
                                        if (!tags.includes(tag)) {
                                            setTags([...tags, tag]);
                                        }
                                    }}
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="tag-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Annuler</button>
                    <button className="submit-btn-minimal" onClick={handleSave}>Enregistrer</button>
                </div>
            </div>
        </div>
    );
}

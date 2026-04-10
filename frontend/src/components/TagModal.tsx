import { useState, useRef, useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Tag, X, Plus, Hash } from 'lucide-react';

interface TagModalProps {
  fileId: string;
  fileName: string;
  currentTags: string[];
  onClose: () => void;
}

export function TagModal({ fileId, fileName, currentTags, onClose }: TagModalProps) {
  const [tags, setTags] = useState<string[]>(currentTags || []);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateFileTags, allTags } = useFileStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const addTag = () => {
    const cleaned = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setNewTag('');
      inputRef.current?.focus();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Escape') onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateFileTags(fileId, tags);
    setIsSaving(false);
    onClose();
  };

  const suggestions = allTags.filter(t => !tags.includes(t)).slice(0, 6);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="glass-heavy rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Tag size={15} className="text-v-accent flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white leading-none">Gérer les tags</h3>
              <p className="text-[10px] text-v-t3 truncate mt-0.5" title={fileName}>{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-v-t3 hover:text-v-t1 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Current tags */}
          <div className="min-h-[44px] flex flex-wrap gap-1.5 p-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(8,8,20,0.6)]">
            {tags.length === 0 && (
              <span className="text-xs text-v-t3 italic self-center w-full text-center">Aucun tag ajouté</span>
            )}
            {tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider text-v-accent-2 bg-v-accent/10 border border-v-accent/20"
              >
                <Hash size={9} />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-white transition-colors cursor-pointer p-0.5"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>

          {/* Input */}
          <div className="relative flex items-center border border-[rgba(255,255,255,0.07)] bg-[rgba(8,8,20,0.7)] rounded-xl overflow-hidden
            focus-within:border-v-accent/40 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.15)] transition-all"
          >
            <Hash size={13} className="ml-3 text-v-t3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="nouveau-tag (Enter pour ajouter)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={30}
              className="flex-1 bg-transparent border-none outline-none py-2.5 px-2 text-sm text-v-t1 placeholder-v-t3"
            />
            <button
              onClick={addTag}
              disabled={!newTag.trim()}
              className="m-1 p-1.5 bg-v-accent text-white rounded-lg hover:bg-v-accent-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-v-t3 uppercase tracking-wider">Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { if (!tags.includes(tag)) setTags([...tags, tag]); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-v-t3 border border-[rgba(255,255,255,0.07)] bg-transparent hover:border-v-accent/30 hover:text-v-accent-3 hover:bg-v-accent/8 transition-all cursor-pointer"
                  >
                    <Plus size={9} />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-v-t2 hover:text-v-t1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold bg-v-accent text-white rounded-lg hover:bg-v-accent-2 shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

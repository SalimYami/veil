import { useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { X, Plus, Hash, Check } from 'lucide-react';

export function TagModal({
  fileId, fileName, currentTags, onClose,
}: {
  fileId: string; fileName: string; currentTags: string[]; onClose: () => void;
}) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [input, setInput] = useState('');
  const { updateFileTags, allTags, addToast } = useFileStore();

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const save = async () => {
    try { await updateFileTags(fileId, tags); addToast('Tags mis à jour', 'success'); onClose(); }
    catch { addToast('Erreur mise à jour tags', 'error'); }
  };

  const suggestions = (allTags || []).filter(t => !tags.includes(t) && t.includes(input.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 anim-in">
      <div className="surface-overlay rounded-xl w-full max-w-sm shadow-2xl anim-scale">

        {/* Header */}
        <div className="px-5 py-4 border-b border-v-border flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-v-t1">Gérer les tags</h3>
            <p className="text-[11px] text-v-t3 mt-0.5 truncate max-w-[250px]">{fileName}</p>
          </div>
          <button onClick={onClose} className="text-v-t3 hover:text-v-t1 cursor-pointer transition-colors"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Current tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-medium bg-v-accent/10 text-v-accent border border-v-accent/20">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-v-accent/60 hover:text-v-accent cursor-pointer transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-v-border bg-v-surface focus-within:border-v-accent/50 transition-colors">
            <Hash size={13} className="text-v-t3" />
            <input
              type="text"
              placeholder="Ajouter un tag..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-v-t1 placeholder-v-t3"
            />
            {input.trim() && (
              <button onClick={() => addTag(input)} className="text-v-accent hover:text-v-accent-h cursor-pointer transition-colors">
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-[10px] text-v-t3 uppercase tracking-wider mb-1.5">Suggestions</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 8).map(s => (
                  <button
                    key={s}
                    onClick={() => addTag(s)}
                    className="h-6 px-2 rounded text-[11px] text-v-t3 border border-v-border bg-v-bg hover:text-v-t2 hover:border-v-border-l cursor-pointer transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-v-border flex justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 text-[12px] text-v-t2 hover:text-v-t1 hover:bg-v-surface rounded-md cursor-pointer transition-colors">
            Annuler
          </button>
          <button onClick={save}
            className="h-8 px-3 text-[12px] font-medium bg-v-accent hover:bg-v-accent-h text-white rounded-md cursor-pointer transition-colors flex items-center gap-1.5">
            <Check size={12} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

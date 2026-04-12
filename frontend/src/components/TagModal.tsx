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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in">
      <div className="card w-full max-w-[340px] shadow-pro animate-in">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-widest text-white/50">Classification</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate max-w-[200px]">{fileName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-white transition-colors"><X size={14} /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Current tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 h-6 px-2 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-primary/50 hover:text-primary transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 h-8 px-2.5 rounded border border-white/5 bg-black/20 focus-within:border-primary/30 transition-colors">
            <Hash size={12} className="text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Add identifier..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
              className="flex-1 bg-transparent border-none outline-none text-[11px] text-white/90 placeholder:text-muted-foreground/30 font-medium"
            />
            {input.trim() && (
              <button onClick={() => addTag(input)} className="text-primary hover:text-primary/80 transition-colors">
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest mb-2">Knowledge Base</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => addTag(s)}
                    className="h-5 px-1.5 rounded text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/50 border border-white/5 bg-white/[0.01] hover:text-white hover:border-white/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex justify-end gap-2 bg-white/[0.01]">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save}
            className="px-3 py-1.5 rounded text-[11px] font-bold bg-primary text-black hover:bg-white transition-colors flex items-center gap-1.5">
            <Check size={11} /> Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

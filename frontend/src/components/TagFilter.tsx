import { useFileStore } from '../store/fileStore';
import { X } from 'lucide-react';

export function TagFilter() {
  const { allTags, activeTag, setActiveTag } = useFileStore();

  if (!allTags || allTags.length === 0) {
    return <p className="text-[12px] text-v-t3 py-4">Aucun tag créé.</p>;
  }

  return (
    <div className="space-y-3">
      {activeTag && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-v-t2">
            Filtre actif : <strong className="text-v-t1">{activeTag}</strong>
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="text-[11px] text-v-t3 hover:text-v-danger flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X size={11} /> Effacer
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTag(null)}
          className={`h-7 px-2.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer
            ${!activeTag
              ? 'bg-v-accent/10 text-v-accent border-v-accent/20'
              : 'text-v-t3 border-v-border bg-v-surface hover:text-v-t2 hover:border-v-border-l'}`}
        >
          Tous
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`h-7 px-2.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer
              ${activeTag === tag
                ? 'bg-v-accent/10 text-v-accent border-v-accent/20'
                : 'text-v-t3 border-v-border bg-v-surface hover:text-v-t2 hover:border-v-border-l'}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

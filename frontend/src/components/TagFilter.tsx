import { useFileStore } from '../store/fileStore';
import { SlidersHorizontal, X } from 'lucide-react';

export function TagFilter() {
  const { allTags, activeTag, setActiveTag } = useFileStore();

  if (!allTags || allTags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={11} className="text-v-t3" />
          <span className="text-[9px] font-mono text-v-t3 uppercase tracking-widest">Filtres tags</span>
        </div>
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            className="text-[9px] text-v-t3 hover:text-v-danger flex items-center gap-0.5 cursor-pointer transition-colors"
          >
            <X size={9} />
            reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer
            ${activeTag === null
              ? 'bg-v-accent/15 text-v-accent-2 border-v-accent/25'
              : 'bg-transparent text-v-t3 border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.12)] hover:text-v-t2'
            }`}
          onClick={() => setActiveTag(null)}
        >
          Tous
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer
              ${activeTag === tag
                ? 'bg-v-accent/15 text-v-accent-2 border-v-accent/25 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                : 'bg-transparent text-v-t3 border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.12)] hover:text-v-t2'
              }`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}

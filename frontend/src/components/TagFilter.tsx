import { useFileStore } from '../store/fileStore';
import { Tag, X } from 'lucide-react';

export function TagFilter() {
  const { allTags, activeTag, setActiveTag } = useFileStore();

  if (!allTags || allTags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
         <div className="w-14 h-14 rounded-2xl bg-card border border-white/[0.04] flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
            <Tag size={24} strokeWidth={1.5} />
         </div>
         <p className="text-[14px] text-muted-foreground font-medium">No taxonomic rules defined.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {activeTag && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-white/[0.02]">
          <span className="text-[13px] text-muted-foreground">
            Current Filter Matrix: <strong className="text-foreground tracking-wide ml-1">{activeTag}</strong>
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <X size={14} /> Clear Matrix
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setActiveTag(null)}
          className={`h-9 px-4 rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-300
            ${!activeTag
              ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
              : 'text-muted-foreground border border-white/[0.04] bg-card hover:bg-secondary hover:text-foreground'}`}
        >
          Glob
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`h-9 px-4 rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-300
              ${activeTag === tag
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-muted-foreground border border-white/[0.04] bg-card hover:bg-secondary hover:text-foreground'}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

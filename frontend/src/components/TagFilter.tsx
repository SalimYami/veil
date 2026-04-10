import { useFileStore } from '../store/fileStore';
import { Tag, Hash } from 'lucide-react';

export function TagFilter() {
    const { allTags, activeTag, setActiveTag } = useFileStore();

    if (!allTags || allTags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Tag size={14} className="text-vault-primary" />
                <span>Filtrer par tag</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono uppercase tracking-wider transition-all duration-200 border ${
                        activeTag === null
                            ? 'bg-vault-primary/20 text-vault-primary border-vault-primary/30 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                            : 'bg-white/5 text-vault-text-muted border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setActiveTag(null)}
                >
                    <Hash size={12} className={activeTag === null ? "opacity-100" : "opacity-50"} />
                    Tous
                </button>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono uppercase tracking-wider transition-all duration-200 border ${
                            activeTag === tag
                                ? 'bg-vault-secondary/20 text-vault-secondary border-vault-secondary/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                : 'bg-white/5 text-vault-text-muted border-transparent hover:bg-white/10 hover:text-white'
                        }`}
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    >
                        <Tag size={12} className={activeTag === tag ? "opacity-100" : "opacity-50"} />
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

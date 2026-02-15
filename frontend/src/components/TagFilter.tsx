import { useFileStore } from '../store/fileStore';
import { Tag, Hash } from 'lucide-react';

export function TagFilter() {
    const { allTags, activeTag, setActiveTag } = useFileStore();

    if (!allTags || allTags.length === 0) {
        return null;
    }

    return (
        <div className="tag-filter">
            <div className="tag-filter-header">
                <Tag size={14} />
                <span>Filtrer par tag</span>
            </div>
            <div className="tag-filter-pills">
                <button
                    className={`tag-pill ${activeTag === null ? 'active' : ''}`}
                    onClick={() => setActiveTag(null)}
                >
                    <Hash size={12} />
                    Tous
                </button>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    >
                        <Tag size={12} />
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, Download, Trash2, Tag, Clock, Activity } from 'lucide-react';

function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay === 1) return 'hier';
    if (diffDay < 7) return `il y a ${diffDay}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getActionIcon(action: string) {
    switch (action) {
        case 'upload': return <Upload size={14} />;
        case 'download': return <Download size={14} />;
        case 'delete': return <Trash2 size={14} />;
        case 'tag': return <Tag size={14} />;
        default: return <Clock size={14} />;
    }
}

function getActionLabel(action: string): string {
    switch (action) {
        case 'upload': return 'Uploadé';
        case 'download': return 'Téléchargé';
        case 'delete': return 'Supprimé';
        case 'tag': return 'Tagué';
        default: return action;
    }
}

function getActionTheme(action: string): string {
    switch (action) {
        case 'upload': return 'text-vault-success bg-vault-success/10 border-vault-success/20';
        case 'download': return 'text-vault-primary bg-vault-primary/10 border-vault-primary/20';
        case 'delete': return 'text-vault-error bg-vault-error/10 border-vault-error/20';
        case 'tag': return 'text-vault-secondary bg-vault-secondary/10 border-vault-secondary/20';
        default: return 'text-vault-text-muted bg-white/5 border-white/10';
    }
}

export function ActivityFeed() {
    const { activities, fetchActivity } = useFileStore();

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-vault-text-muted gap-2 opacity-60">
                <Activity size={24} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Aucune activité récente</p>
                <p className="text-xs text-center max-w-[200px]">Vos actions apparaîtront ici</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="flex items-center justify-between text-sm font-semibold text-white/90 sticky top-0 bg-vault-bg-tertiary/90 backdrop-blur-md pb-2 z-10">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-vault-secondary" />
                    <span>Activité récente</span>
                </div>
                <span className="text-[0.65rem] font-mono font-medium px-2 py-0.5 bg-white/5 rounded-full text-vault-text-muted">{activities.length} événements</span>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 pb-2">
                {activities.slice(0, 20).map((entry, index) => (
                    <div 
                        key={`${entry.file_id}-${index}`} 
                        className="group flex gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors animate-[fadeIn_0.3s_ease-out_forwards] opacity-0"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${getActionTheme(entry.action)}`}>
                            {getActionIcon(entry.action)}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{getActionLabel(entry.action)}</span>
                                <span className="text-[0.65rem] text-vault-text-muted font-medium whitespace-nowrap">{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                            
                            <span className="text-xs text-vault-text-secondary truncate block font-medium" title={entry.file_name}>
                                {entry.file_name}
                            </span>
                            
                            {entry.details && (
                                <span className="text-[0.65rem] text-vault-text-muted mt-1 italic truncate block opacity-80">
                                    {entry.details}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

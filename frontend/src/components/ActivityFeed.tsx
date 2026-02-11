import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, Download, Trash2, Tag, Clock } from 'lucide-react';

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

function getActionColor(action: string): string {
    switch (action) {
        case 'upload': return 'var(--success)';
        case 'download': return 'var(--primary)';
        case 'delete': return 'var(--error)';
        case 'tag': return 'var(--secondary)';
        default: return 'var(--text-muted)';
    }
}

export function ActivityFeed() {
    const { activities, fetchActivity } = useFileStore();

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    if (activities.length === 0) {
        return (
            <div className="activity-empty">
                <Clock size={20} />
                <p>Aucune activité</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            <div className="activity-header">
                <Clock size={14} />
                <span>Activité récente</span>
            </div>
            <div className="activity-list">
                {activities.slice(0, 20).map((entry, index) => (
                    <div key={`${entry.file_id}-${index}`} className="activity-item">
                        <div
                            className="activity-icon"
                            style={{ color: getActionColor(entry.action) }}
                        >
                            {getActionIcon(entry.action)}
                        </div>
                        <div className="activity-content">
                            <div className="activity-action">
                                <span className="activity-label">{getActionLabel(entry.action)}</span>
                                <span className="activity-file">{entry.file_name}</span>
                            </div>
                            {entry.details && (
                                <span className="activity-details">{entry.details}</span>
                            )}
                        </div>
                        <span className="activity-time">
                            {formatRelativeTime(entry.timestamp)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

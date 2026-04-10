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
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return 'hier';
  if (diffDay < 7) return `${diffDay}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const ACTION_CONFIG: Record<string, { icon: typeof Upload; label: string; color: string; dot: string }> = {
  upload:   { icon: Upload,   label: 'Upload',    color: 'text-v-success',  dot: 'bg-v-success' },
  download: { icon: Download, label: 'Download',  color: 'text-v-accent-2', dot: 'bg-v-accent' },
  delete:   { icon: Trash2,   label: 'Supprimé',  color: 'text-v-danger',   dot: 'bg-v-danger' },
  tag:      { icon: Tag,      label: 'Tagué',     color: 'text-v-warn',     dot: 'bg-v-warn' },
};

export function ActivityFeed() {
  const { activities, fetchActivity } = useFileStore();

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center opacity-50">
        <Activity size={18} className="text-v-t3" />
        <p className="text-xs text-v-t3">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {activities.slice(0, 20).map((entry, index) => {
        const cfg = ACTION_CONFIG[entry.action] || { icon: Clock, label: entry.action, color: 'text-v-t3', dot: 'bg-v-t3' };
        const Icon = cfg.icon;
        return (
          <div
            key={`${entry.file_id}-${index}`}
            className="group flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default"
            style={{ animationDelay: `${index * 0.04}s` }}
          >
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} opacity-70`} />
              {index < activities.slice(0, 20).length - 1 && (
                <div className="w-px flex-1 bg-[rgba(255,255,255,0.05)] mt-1" style={{ minHeight: '12px' }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} className={cfg.color} />
                  <span className={`text-[10px] font-semibold font-mono uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className="text-[9px] text-v-t3 font-mono flex-shrink-0">{formatRelativeTime(entry.timestamp)}</span>
              </div>
              <p className="text-[11px] text-v-t2 truncate leading-snug group-hover:text-v-t1 transition-colors" title={entry.file_name}>
                {entry.file_name}
              </p>
              {entry.details && (
                <p className="text-[10px] text-v-t3 truncate mt-0.5 italic">{entry.details}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

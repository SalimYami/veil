import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, Download, Trash2, Tag, Activity } from 'lucide-react';

function timeAgo(ts: string): string {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `${days}j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const ACTIONS: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  upload:   { icon: Upload,   label: 'Upload',    color: 'text-v-success' },
  download: { icon: Download, label: 'Download',  color: 'text-v-info' },
  delete:   { icon: Trash2,   label: 'Supprimé',  color: 'text-v-danger' },
  tag:      { icon: Tag,      label: 'Tag',        color: 'text-v-warn' },
};

export function ActivityFeed() {
  const { activities, fetchActivity } = useFileStore();
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Activity size={20} className="text-v-t3 mb-2 opacity-50" />
        <p className="text-[12px] text-v-t3">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-v-border divide-y divide-v-border overflow-hidden">
      {activities.slice(0, 25).map((entry, i) => {
        const a = ACTIONS[entry.action] || { icon: Activity, label: entry.action, color: 'text-v-t3' };
        const Icon = a.icon;
        return (
          <div key={`${entry.file_id}-${i}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-v-surface/50 transition-colors">
            <Icon size={13} className={a.color} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-v-t1 truncate">{entry.file_name}</p>
              {entry.details && <p className="text-[10px] text-v-t3 truncate">{entry.details}</p>}
            </div>
            <span className={`text-[10px] font-mono flex-shrink-0 ${a.color}`}>{a.label}</span>
            <span className="text-[10px] text-v-t3 flex-shrink-0 w-14 text-right font-mono">{timeAgo(entry.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
}

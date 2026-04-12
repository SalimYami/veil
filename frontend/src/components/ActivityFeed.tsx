import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { Upload, Download, Trash2, Tag, Activity } from 'lucide-react';

function timeAgo(ts: string): string {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

const ACTIONS: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  upload:   { icon: Upload,   label: 'UPLOADED',  color: 'text-emerald-400' },
  download: { icon: Download, label: 'ACCESSED',  color: 'text-sky-400' },
  delete:   { icon: Trash2,   label: 'PURGED',    color: 'text-destructive' },
  tag:      { icon: Tag,      label: 'TAGGED',    color: 'text-amber-400' },
};

export function ActivityFeed() {
  const { activities, fetchActivity } = useFileStore();
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
         <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-center text-muted-foreground/40 mb-4">
            <Activity size={20} />
         </div>
         <p className="text-[12px] text-muted-foreground/50 font-medium">No system activity logged.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.03] bg-black/20 backdrop-blur-sm divide-y divide-white/[0.02] overflow-hidden shadow-inner animate-in">
      {activities.slice(0, 20).map((entry, i) => {
        const a = ACTIONS[entry.action] || { icon: Activity, label: entry.action.toUpperCase(), color: 'text-muted-foreground' };
        const Icon = a.icon;
        return (
          <div key={`${entry.file_id}-${i}`} className="flex items-center gap-3 px-5 py-3 bg-transparent hover:bg-white/[0.02] transition-colors">
            <div className={`p-1.5 rounded bg-white/[0.02] ${a.color} border border-white/5`}>
               <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[12px] font-semibold text-white/90 truncate">{entry.file_name}</p>
              {entry.details && <p className="text-[10px] text-muted-foreground/50 tracking-wide mt-0.5 truncate uppercase font-bold">{entry.details}</p>}
            </div>
            <span className={`text-[9px] font-black tracking-[0.15em] flex-shrink-0 bg-black/40 px-2 py-0.5 rounded border border-white/[0.05] ${a.color}`}>
              {a.label}
            </span>
            <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 w-20 text-right font-bold opacity-80">
              {timeAgo(entry.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

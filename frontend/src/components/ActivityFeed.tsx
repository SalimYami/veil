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
      <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
         <div className="w-14 h-14 rounded-2xl bg-card border border-white/[0.04] flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
            <Activity size={24} strokeWidth={1.5} />
         </div>
         <p className="text-[14px] text-muted-foreground font-medium">No recent operations logged.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card/40 backdrop-blur-sm divide-y divide-white/[0.02] overflow-hidden max-w-4xl shadow-inner animate-fadeIn space-y-[1px]">
      {activities.slice(0, 25).map((entry, i) => {
        const a = ACTIONS[entry.action] || { icon: Activity, label: entry.action.toUpperCase(), color: 'text-muted-foreground' };
        const Icon = a.icon;
        return (
          <div key={`${entry.file_id}-${i}`} className="flex items-center gap-4 px-6 py-4 bg-transparent hover:bg-secondary/40 transition-colors">
            <div className={`p-2 rounded-lg bg-secondary/80 ${a.color} shadow-sm border border-white/[0.02]`}>
               <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[14px] font-semibold text-foreground truncate">{entry.file_name}</p>
              {entry.details && <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{entry.details}</p>}
            </div>
            <span className={`text-[11px] font-bold tracking-widest flex-shrink-0 bg-background/50 px-2.5 py-1 rounded-md border border-white/[0.02] ${a.color}`}>
              {a.label}
            </span>
            <span className="text-[12px] text-muted-foreground flex-shrink-0 w-24 text-right font-medium opacity-80">
              {timeAgo(entry.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

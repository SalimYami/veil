import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Logo } from './Logo';
import {
  ArrowLeft, Users, HardDrive, FileText, Shield, RefreshCcw,
  Server
} from 'lucide-react';

type StorageEntry = { id: string; hash: string; size: number; created_at: string };

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<{ email: string; role: string; created_at: string }[]>([]);
  const [storage, setStorage] = useState<StorageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [u, s] = await Promise.all([
        fetch(`${API}/admin/users`, { headers: h }).then(r => r.json()),
        fetch(`${API}/admin/storage`, { headers: h }).then(r => r.json()),
      ]);
      setUsers(u.users || []);
      setStorage(s.entries || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSize = storage.reduce((a, s) => a + s.size, 0);
  const formatMB = (b: number) => (b / 1024 / 1024).toFixed(1);

  const stats = [
    { label: 'Utilisateurs',    value: users.length, icon: <Users size={15} />,     color: 'text-v-accent' },
    { label: 'Blobs stockés',   value: storage.length, icon: <FileText size={15} />,  color: 'text-v-info' },
    { label: 'Stockage total',  value: `${formatMB(totalSize)} MB`, icon: <HardDrive size={15} />, color: 'text-v-warn' },
    { label: 'Statut',          value: 'Actif', icon: <Shield size={15} />,            color: 'text-v-success' },
  ];

  return (
    <div className="fixed inset-0 bg-v-bg text-v-t1 flex flex-col font-['Inter']">

      {/* Header */}
      <header className="flex-shrink-0 h-[52px] flex items-center px-4 gap-3 border-b border-v-border z-50">
        <button onClick={onBack}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] text-v-t2 hover:text-v-t1 hover:bg-v-surface border border-v-border transition-colors cursor-pointer">
          <ArrowLeft size={13} /> Retour
        </button>
        <div className="h-5 w-px bg-v-border" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-v-warn/10 border border-v-warn/20 flex items-center justify-center text-v-warn">
            <Logo size={14} />
          </div>
          <span className="text-[13px] font-semibold text-v-t1">Administration</span>
        </div>
        <div className="flex-1" />
        <button onClick={fetchData} className="w-7 h-7 rounded-md border border-v-border bg-v-surface text-v-t3 hover:text-v-t2 flex items-center justify-center cursor-pointer transition-colors">
          <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="p-4 rounded-lg border border-v-border bg-v-surface">
                <div className="flex items-center gap-2 mb-3">
                  <span className={s.color}>{s.icon}</span>
                  <span className="text-[11px] text-v-t3 font-medium">{s.label}</span>
                </div>
                <p className="text-[22px] font-semibold text-v-t1 leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div>
            <h2 className="text-[14px] font-semibold text-v-t1 mb-3 flex items-center gap-2">
              <Users size={14} className="text-v-accent" /> Utilisateurs
            </h2>
            <div className="rounded-lg border border-v-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-v-surface text-[11px] font-medium text-v-t3 uppercase tracking-wider border-b border-v-border">
                <span className="flex-1">Email</span>
                <span className="w-20 text-center">Rôle</span>
                <span className="w-24 text-right">Inscription</span>
              </div>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[44px] animate-pulse bg-v-surface/30 border-b border-v-border last:border-0" />
                ))
              ) : users.length === 0 ? (
                <p className="p-4 text-[12px] text-v-t3 text-center">Aucun utilisateur</p>
              ) : (
                users.map(u => (
                  <div key={u.email} className="flex items-center gap-3 px-4 py-3 border-b border-v-border last:border-0 hover:bg-v-surface/50 transition-colors">
                    <span className="flex-1 text-[13px] text-v-t1 truncate">{u.email}</span>
                    <span className={`w-20 text-center text-[11px] font-medium rounded-md px-2 py-0.5
                      ${u.role === 'admin' ? 'bg-v-warn/10 text-v-warn' : 'bg-v-surface text-v-t3'}`}>
                      {u.role}
                    </span>
                    <span className="w-24 text-right text-[11px] text-v-t3 font-mono">
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Storage table */}
          <div>
            <h2 className="text-[14px] font-semibold text-v-t1 mb-3 flex items-center gap-2">
              <HardDrive size={14} className="text-v-info" /> Stockage chiffré
            </h2>
            <div className="rounded-lg border border-v-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-v-surface text-[11px] font-medium text-v-t3 uppercase tracking-wider border-b border-v-border">
                <span className="flex-1">Hash SHA-256</span>
                <span className="w-20 text-right">Taille</span>
                <span className="w-24 text-right">Créé le</span>
              </div>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[44px] animate-pulse bg-v-surface/30 border-b border-v-border last:border-0" />
                ))
              ) : storage.length === 0 ? (
                <p className="p-4 text-[12px] text-v-t3 text-center">Aucune donnée</p>
              ) : (
                storage.slice(0, 50).map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-v-border last:border-0 hover:bg-v-surface/50 transition-colors">
                    <code className="flex-1 text-[11px] font-mono text-v-accent truncate">{e.hash}</code>
                    <span className="w-20 text-right text-[11px] font-mono text-v-t3">
                      {e.size < 1024 ? `${e.size} B` : e.size < 1048576 ? `${(e.size/1024).toFixed(0)} KB` : `${(e.size/1048576).toFixed(1)} MB`}
                    </span>
                    <span className="w-24 text-right text-[11px] text-v-t3 font-mono">
                      {new Date(e.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ZK notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-v-success/20 bg-v-success/[0.04]">
            <Server size={15} className="text-v-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-medium text-v-success mb-0.5">Garantie Zero-Knowledge</p>
              <p className="text-[11px] text-v-t3 leading-relaxed">
                Le serveur stocke exclusivement des blobs chiffrés AES-256-GCM. Aucun contenu
                utilisateur n'est accessible côté serveur, y compris par les administrateurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

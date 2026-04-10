/**
 * VEIL OS — AdminDashboard v3
 * Interface d'administration système — monitoring & storage inspection
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getAdminDashboard,
  getAdminStorage,
  type AdminDashboard as AdminDashboardType,
  type AdminFile
} from '../lib/api';
import {
  Activity, Users, HardDrive, FileCode, ShieldCheck,
  RefreshCcw, Database, Clock, ArrowLeft, CheckCircle2,
  TrendingUp, Server, AlertTriangle
} from 'lucide-react';
import { Logo } from './Logo';

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`relative p-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden group hover:border-[rgba(255,255,255,0.1)] transition-all duration-200`}>
      {/* Glow top-right */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accent.includes('accent') ? 'bg-v-accent/10 border-v-accent/20 text-v-accent-2' : accent.includes('success') ? 'bg-v-success/10 border-v-success/20 text-v-success' : accent.includes('warn') ? 'bg-v-warn/10 border-v-warn/20 text-v-warn' : 'bg-v-info/10 border-v-info/20 text-v-info'}`}>
            {icon}
          </div>
          <TrendingUp size={12} className="text-v-t3 opacity-50" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
        <p className="text-xs font-medium text-v-t2 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-v-t3 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardType | null>(null);
  const [storage, setStorage] = useState<AdminFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [statsData, storageData] = await Promise.all([
        getAdminDashboard(token),
        getAdminStorage(token)
      ]);
      setStats(statsData);
      setStorage(storageData.files);
      setError(null);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      setError('Erreur lors de la récupération des données admin');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-v-bg text-v-t1 flex flex-col font-['Inter']">
      {/* Ambient */}
      <div className="fixed inset-0 dot-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-v-warn opacity-[0.025] blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 h-[60px] flex items-center px-6 gap-4 glass-heavy border-b border-[rgba(255,255,255,0.06)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] text-v-t2 hover:text-v-t1 text-sm font-medium transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          Retour
        </button>

        <div className="flex items-center gap-2.5 ml-1">
          <div className="w-7 h-7 rounded-lg glass flex items-center justify-center">
            <Logo size={16} />
          </div>
          <span className="font-bold text-sm tracking-widest text-white">VEIL</span>
          <span className="text-[9px] font-mono text-v-warn bg-v-warn/10 border border-v-warn/25 px-1.5 py-0.5 rounded-md tracking-widest uppercase">Admin</span>
        </div>

        <div className="flex-1" />

        {/* Last refresh */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-v-t3">
          <Clock size={10} />
          Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] text-v-t2 hover:text-v-t1 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto custom-scroll relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Page title */}
          <div className="flex items-start gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-v-danger/25 bg-v-danger/10 text-v-danger text-[10px] font-mono uppercase tracking-widest mb-3">
                <ShieldCheck size={10} />
                Root Access
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Monitoring</h1>
              <p className="text-v-t3 text-sm mt-1">Statistiques d'infrastructure en temps réel</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-v-danger/25 bg-v-danger/8 text-v-danger text-sm animate-fade-in">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && !stats && (
            <div className="flex items-center gap-3 py-12 justify-center">
              <RefreshCcw size={20} className="text-v-accent animate-spin" />
              <span className="text-v-t2 text-sm">Initialisation du terminal admin...</span>
            </div>
          )}

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
              <StatCard
                icon={<Users size={18} />}
                label="Utilisateurs"
                value={stats.users.total}
                sub={`${stats.users.total} comptes actifs`}
                accent="bg-v-accent/20"
              />
              <StatCard
                icon={<FileCode size={18} />}
                label="Fichiers chiffrés"
                value={stats.storage.total_files}
                sub="Blobs AES-256-GCM"
                accent="bg-v-info/20"
              />
              <StatCard
                icon={<HardDrive size={18} />}
                label="Volume stockage"
                value={`${stats.storage.total_size_mb} MB`}
                sub="Blobs opaques"
                accent="bg-v-warn/20"
              />
              <StatCard
                icon={<Activity size={18} />}
                label="Santé système"
                value={
                  <span className="flex items-center gap-2 text-v-success">
                    <CheckCircle2 size={20} />
                    {stats.system.status.toUpperCase()}
                  </span>
                }
                sub="API opérationnelle"
                accent="bg-v-success/20"
              />
            </div>
          )}

          {/* Storage table */}
          <div className="glass rounded-2xl overflow-hidden animate-fade-up">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-v-accent/10 border border-v-accent/20 flex items-center justify-center text-v-accent">
                  <Database size={16} />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">Vue Physique du Stockage</h2>
                  <p className="text-xs text-v-t3">Inspection des blobs chiffrés sur le serveur</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-v-t3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg">
                {storage.length} entrée{storage.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]">
                    {['Utilisateur', 'ID Fichier', 'Taille', 'SHA-256', 'Date Upload'].map(col => (
                      <th key={col} className="px-5 py-3 text-[10px] font-semibold text-v-t3 uppercase tracking-widest bg-[rgba(255,255,255,0.02)]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {storage?.map((file, i) => (
                    <tr
                      key={file.file_id}
                      className={`border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)]
                        ${i % 2 === 0 ? '' : 'bg-[rgba(255,255,255,0.01)]'}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-v-t2">{file.user_id}</td>
                      <td className="px-5 py-3.5">
                        <code className="text-[11px] font-mono text-v-accent-3 truncate block max-w-[140px]" title={file.file_id}>
                          {file.file_id.substring(0, 8)}...{file.file_id.slice(-4)}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-mono text-v-t2 bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-md border border-[rgba(255,255,255,0.06)]">
                          {formatSize(file.size_bytes)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="text-[10px] font-mono text-v-accent px-2 py-1 bg-v-accent/8 rounded-md border border-v-accent/15">
                          {file.sha256_hash.substring(0, 12)}...
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-v-t3">
                          <Clock size={11} className="opacity-60" />
                          {new Date(file.created_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!storage || storage.length === 0) && !isLoading && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-v-t3 text-sm italic">
                        Aucun fichier physique détecté sur le serveur
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ZK guarantee banner */}
          <div className="flex items-start gap-4 p-5 rounded-2xl border border-v-success/15 bg-v-success/5 animate-fade-up">
            <div className="w-10 h-10 rounded-xl bg-v-success/10 border border-v-success/20 flex items-center justify-center text-v-success flex-shrink-0">
              <Server size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1 flex items-center gap-2">
                <ShieldCheck size={15} className="text-v-success" />
                Garantie Zero-Knowledge
              </h3>
              <p className="text-xs text-v-t3 leading-relaxed max-w-2xl">
                Le serveur stocke <strong className="text-v-t2">uniquement des blobs binaires opaques</strong> avec leurs
                identifiants aléatoires (UUIDs). L'absence totale de métadonnées lisibles garantit qu'il est
                cryptographiquement impossible pour l'administrateur de lire le contenu ou les vrais noms des fichiers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

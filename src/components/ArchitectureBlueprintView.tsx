import React, { useState } from 'react';
import { Database, Layers, GitBranch, Code2, Copy, Check } from 'lucide-react';

const ERD_TABLES = [
  {
    name: 'users',
    pk: 'id (SERIAL)',
    uk: 'uid (TEXT)',
    desc: 'Data profil anggota, RBAC role (admin, anggota_aktif, anggota_muda), NIA, Gol. Darah, Kontak Darurat & Kredensial Biometrik WebAuthn.',
    columns: ['id PK', 'uid UNIQUE', 'email', 'full_name', 'nia', 'role', 'division', 'batch_name', 'blood_type', 'emergency_contact_phone', 'biometric_registered'],
  },
  {
    name: 'finance_transactions',
    pk: 'id (SERIAL)',
    fk: 'user_id -> users.id',
    desc: 'Pencatatan arus kas masuk/keluar, iuran kas bulanan anggota, status Lunas/Menunggak, bukti transfer/nota, dan verifikator LPJ.',
    columns: ['id PK', 'user_id FK', 'member_name', 'type', 'category', 'amount', 'month_period', 'payment_status', 'receipt_url', 'verified_by'],
  },
  {
    name: 'activities',
    pk: 'id (SERIAL)',
    fk: '-',
    desc: 'Agenda operasional (Rapat, Diksar, Ekspedisi, Pemeliharaan Alat), titik koordinat, PJ, QR Token Presensi, & Laporan Otomatis.',
    columns: ['id PK', 'title', 'category', 'start_date', 'end_date', 'location', 'coordinates', 'pic_name', 'rundown', 'status', 'qr_code_token', 'auto_report_summary'],
  },
  {
    name: 'activity_attendances',
    pk: 'id (SERIAL)',
    fk: 'activity_id -> activities.id, user_id -> users.id',
    desc: 'Tabel relasional presensi kehadiran anggota pada kegiatan melalui scan QR Code, Biometrik, atau RSVP.',
    columns: ['id PK', 'activity_id FK', 'user_id FK', 'member_name', 'rsvp_status', 'check_in_method', 'check_in_time'],
  },
  {
    name: 'announcements',
    pk: 'id (SERIAL)',
    fk: '-',
    desc: 'Sistem Jarkom (Darurat, Info Kegiatan, Tagihan Kas, Update Tugas) dengan Push Notification & pelacakan daftar keterbacaan (read receipt).',
    columns: ['id PK', 'title', 'category', 'content', 'sender_name', 'target_audience', 'read_by_list (JSON)'],
  },
  {
    name: 'documents',
    pk: 'id (SERIAL)',
    fk: '-',
    desc: 'Digital Vault berisi SOP resmi (Pendakian, Caving, Climbing, Rafting, P3K) dan Template Surat Administrasi sesuai level akses peran.',
    columns: ['id PK', 'title', 'doc_type', 'category', 'code_number', 'version', 'access_minimum_role', 'checklist_items (JSON)'],
  },
  {
    name: 'equipment & equipment_loans',
    pk: 'id (SERIAL)',
    fk: 'equipment_id -> equipment.id',
    desc: 'Katalog inventaris logistik (Tenda, Carrier, Harness, Carabiner, Perahu) beserta status kondisi Baik/Rusak dan transaksi peminjaman.',
    columns: ['id PK', 'item_code', 'name', 'total_qty', 'available_qty', 'condition_good', 'condition_damaged', 'borrower_name', 'borrow_date', 'return_date'],
  },
  {
    name: 'expedition_logs & sos_signals',
    pk: 'id (SERIAL)',
    fk: 'user_id -> users.id',
    desc: 'Logbook riwayat ekspedisi anggota serta pancaran darurat SOS Field-Safety lengkap dengan koordinat GPS, elevasi, dan status tim SAR.',
    columns: ['id PK', 'member_name', 'expedition_title', 'discipline', 'elevation_or_depth', 'latitude', 'longitude', 'emergency_type', 'dispatched_team'],
  },
];

const CODE_SNIPPET = `// Contoh Implementasi RBAC Middleware, Auto-Report Kegiatan & Offline Sync Queue
export const checkRolePermission = (userRole: 'admin' | 'anggota_aktif' | 'anggota_muda', required: string) => {
  const hierarchy = { admin: 3, anggota_aktif: 2, anggota_muda: 1 };
  return hierarchy[userRole] >= (hierarchy[required as keyof typeof hierarchy] || 1);
};

// Trigger Pelaporan Otomatis & Push Notifikasi saat Kegiatan Lapangan Selesai
export async function finalizeFieldOperation(activityId: number, metrics: { participants: number; notes: string }) {
  const autoSummary = \`LAPORAN OTOMATIS [SELESAI]: Diikuti \${metrics.participants} personel. Evaluasi: \${metrics.notes}\`;
  const res = await fetch(\`/api/activities/\${activityId}/complete\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoReportSummary: autoSummary }),
  });
  if (Notification.permission === 'granted') {
    new Notification('Wanapala App — Laporan Otomatis Terbit', { body: autoSummary });
  }
  return res.json();
}`;

export const ArchitectureBlueprintView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="border-b border-stone-800 pb-5">
        <p className="text-xs text-orange-400 font-mono mb-1">
          DOKUMENTASI TEKNIS · ARSITEKTUR SISTEM & DATABASE RELASIONAL
        </p>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
          Rancangan Arsitektur, ERD PostgreSQL & Alur Navigasi Wanapala App
        </h2>
        <p className="text-sm text-stone-400 mt-1 max-w-3xl">
          Spesifikasi teknis menyeluruh untuk operasional organisasi pencinta alam yang telah diimplementasikan secara langsung pada aplikasi ini menggunakan PostgreSQL (Cloud SQL), Drizzle ORM, React 19, dan Service Worker Offline-First.
        </p>
      </div>

      {/* 1. Rekomendasi Tech Stack */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            01. Rekomendasi & Implementasi Tech Stack
          </h3>
          <span className="text-xs text-stone-400 font-mono">
            Full-Stack TypeScript · Offline-Ready PWA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-orange-400">FRONTEND & PWA</div>
            <div className="text-base font-semibold text-stone-100">React 19 + Tailwind CSS + Vite PWA</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Antarmuka responsif dengan tema khas Oranye Wanapala (visibilitas tinggi di lapangan). Dilengkapi Workbox Service Worker & Local Queue untuk sinkronisasi saat sinyal hilang di gunung/gua.
            </p>
          </div>

          <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-orange-400">BACKEND & API</div>
            <div className="text-base font-semibold text-stone-100">Node.js + Express REST API</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Arsitektur API modular dengan middleware verifikasi token, endpoint sinkronisasi antrean offline (`/api/sync-offline`), dan generator laporan aktivitas otomatis.
            </p>
          </div>

          <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-orange-400">DATABASE & ORM</div>
            <div className="text-base font-semibold text-stone-100">PostgreSQL (Cloud SQL) + Drizzle ORM</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Basis data relasional ACID untuk integritas transaksi kas, stok peminjaman logistik, presensi QR/Biometrik, dan rekam jejak sinyal SOS darurat.
            </p>
          </div>

          <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-orange-400">SECURITY & INTEGRATIONS</div>
            <div className="text-base font-semibold text-stone-100">Firebase Auth + WebAuthn + jsPDF + iCal</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Otentikasi Google OAuth & Biometrik Sidik Jari/Wajah (WebAuthn), Web Push Notification API, ekspor LPJ PDF otomatis, serta sinkronisasi Google Calendar / `.ics`.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Skema Database Relasional (ERD) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-400" />
            02. Skema Database Relasional (ERD PostgreSQL — 10 Tabel Utama)
          </h3>
          <span className="text-xs text-stone-400 font-mono">
            src/db/schema.ts · Terhubung ke Cloud SQL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ERD_TABLES.map((tbl) => (
            <div
              key={tbl.name}
              className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                  <span className="font-mono text-sm font-semibold text-orange-400">{tbl.name}</span>
                  <span className="text-xs font-mono text-stone-400">
                    PK: {tbl.pk} {tbl.fk && tbl.fk !== '-' ? `· FK: ${tbl.fk}` : ''}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{tbl.desc}</p>
              </div>
              <div className="pt-2 border-t border-stone-800/60 text-[11px] font-mono text-stone-400 leading-relaxed">
                {tbl.columns.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Struktur Menu, RBAC & Navigation Flow */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-orange-400" />
            03. Matriks Kontrol Akses Berbasis Peran (RBAC) & Alur Navigasi UI/UX
          </h3>
          <span className="text-xs text-stone-400 font-mono">
            3 Peran Pengguna · Simulasi Langsung di Header
          </span>
        </div>

        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-300 font-mono">
                <th className="py-3 px-4">Modul / Fitur Navigasi</th>
                <th className="py-3 px-4">Admin / Pengurus Harian</th>
                <th className="py-3 px-4">Anggota Aktif</th>
                <th className="py-3 px-4">Anggota Muda / Calon (MBIM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70 text-stone-300">
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">1. Analitik & Keuangan Kas</td>
                <td className="py-2.5 px-4 text-orange-400">Kelola Kas, Verifikasi Bukti, Ekspor LPJ PDF</td>
                <td className="py-2.5 px-4">Lihat Transparansi Kas, Bayar & Unggah Nota</td>
                <td className="py-2.5 px-4 text-stone-500">Hanya Ringkasan Saldo Umum</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">2. Timeline Kegiatan & Kalender</td>
                <td className="py-2.5 px-4 text-orange-400">Buat Agenda, Buka QR Presensi, Terbitkan Auto-Report</td>
                <td className="py-2.5 px-4">Semua Agenda, Presensi QR/Biometrik, Sync Google Cal</td>
                <td className="py-2.5 px-4 text-amber-300">Terbatas Agenda Diksar / MBIM & Umum</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">3. Jarkom & Push Notification</td>
                <td className="py-2.5 px-4 text-orange-400">Kirim Siaran Darurat/Tugas & Pantau Keterbacaan</td>
                <td className="py-2.5 px-4">Terima Notifikasi Push & Konfirmasi Baca</td>
                <td className="py-2.5 px-4">Terima Pengumuman Diksar & Konfirmasi Baca</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">4. SOP Administrasi & Digital Vault</td>
                <td className="py-2.5 px-4 text-orange-400">Akses Penuh & Kelola Revisi Dokumen SOP</td>
                <td className="py-2.5 px-4">Akses Seluruh SOP Teknis & Template Surat</td>
                <td className="py-2.5 px-4 text-amber-300">Hanya SOP Dasar (Pendakian, P3K) & Surat Izin Ortu</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">5. Inventaris Logistik & Logbook</td>
                <td className="py-2.5 px-4 text-orange-400">Audit Kondisi Alat, Setujui Pinjaman & Verifikasi Log</td>
                <td className="py-2.5 px-4">Ajukan Peminjaman Alat & Catat Logbook Ekspedisi</td>
                <td className="py-2.5 px-4">Lihat Katalog Alat & Profil Anggota</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-stone-100">6. Tombol Darurat SOS Field-Safety</td>
                <td className="py-2.5 px-4 text-orange-400">Komando Posko SAR, Kerahkan Tim Respon & DPO</td>
                <td className="py-2.5 px-4 text-rose-400">Kirim Sinyal SOS + Koordinat GPS Terkini</td>
                <td className="py-2.5 px-4 text-rose-400">Kirim Sinyal SOS + Koordinat GPS Terkini</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Snippet Kode Arsitektur */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-orange-400" />
            04. Cuplikan Kode Inti: RBAC Guard & Sistem Pelaporan Otomatis
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin' : 'Salin Snippet'}
          </button>
        </div>
        <pre className="bg-[#0C0908] border border-stone-800 rounded-lg p-4 text-xs font-mono text-stone-300 overflow-x-auto leading-relaxed">
          <code>{CODE_SNIPPET}</code>
        </pre>
      </section>
    </div>
  );
};

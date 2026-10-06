import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Download,
} from 'lucide-react';
import { exportFinanceLPJToPDF } from '../utils/pdfExport.ts';

interface Props {
  role: 'admin' | 'anggota_aktif' | 'anggota_muda';
  currentUserName: string;
  finance: any[];
  activities: any[];
  equipment: any[];
  expeditionLogs: any[];
  onAddFinance: (payload: any) => Promise<void>;
  onVerifyFinance: (id: number, status: string) => Promise<void>;
}

export const FinanceAnalyticsView: React.FC<Props> = ({
  role,
  currentUserName,
  finance,
  activities,
  equipment,
  expeditionLogs,
  onAddFinance,
  onVerifyFinance,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran' | 'menunggak'>('all');
  const [showForm, setShowForm] = useState(false);
  const [memberName, setMemberName] = useState(currentUserName);
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [category, setCategory] = useState('Kas Bulanan');
  const [amount, setAmount] = useState('50000');
  const [monthPeriod, setMonthPeriod] = useState('Oktober 2026');
  const [receiptUrl, setReceiptUrl] = useState('NOTA-TRANSFER-OKT26.pdf');
  const [description, setDescription] = useState('Pembayaran Kas Bulanan Oktober 2026');
  const [submitting, setSubmitting] = useState(false);

  const totalIncome = finance
    .filter((t) => t.type === 'pemasukan' && t.paymentStatus !== 'Menunggak')
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

  const totalExpense = finance
    .filter((t) => t.type === 'pengeluaran')
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

  const finalBalance = totalIncome - totalExpense;
  const arrearsCount = finance.filter((t) => t.paymentStatus === 'Menunggak').length;

  const totalGear = equipment.reduce((acc, item) => acc + Number(item.totalQty || 0), 0);
  const goodGear = equipment.reduce((acc, item) => acc + Number(item.conditionGood || 0), 0);
  const gearReadinessPct = totalGear > 0 ? Math.round((goodGear / totalGear) * 100) : 100;

  const filteredFinance = finance.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'menunggak') return item.paymentStatus === 'Menunggak';
    return item.type === filterType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddFinance({
        memberName,
        type,
        category,
        amount: Number(amount),
        monthPeriod,
        paymentStatus: role === 'admin' ? 'Terverifikasi' : 'Lunas',
        receiptUrl,
        description,
        verifiedBy: role === 'admin' ? `${currentUserName} (Pengurus)` : 'Menunggu Verifikasi Bendahara',
      });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Anggota/Divisi', 'Jenis', 'Kategori', 'Nominal', 'Periode', 'Status', 'Bukti Nota', 'Keterangan'];
    const rows = finance.map((f) => [
      f.id,
      `"${f.memberName}"`,
      f.type,
      `"${f.category}"`,
      f.amount,
      `"${f.monthPeriod}"`,
      f.paymentStatus,
      `"${f.receiptUrl}"`,
      `"${f.description}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LPJ_Kas_Wanapala_Oktober_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <p className="text-xs text-orange-400 font-mono mb-1">
            TRANSPARANSI KAS ORGANISASI · ANALITIK PERFORMA TIM REAL-TIME
          </p>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">
            Dashboard Analitik Tim & Laporan Keuangan Kas (LPJ)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportFinanceLPJToPDF(finance)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg border border-stone-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            Ekspor LPJ (PDF Otomatis)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg border border-stone-700 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            Unduh Excel / CSV
          </button>
          {role !== 'anggota_muda' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Catat Kas / Unggah Nota
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Financial & Team Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4">
          <div className="text-xs text-stone-400">Saldo Akhir Kas Organisasi</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-400 mt-1">
            Rp {finalBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-2 font-mono">
            Periode Aktif · Oktober 2026
          </div>
        </div>

        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4">
          <div className="text-xs text-stone-400 flex items-center justify-between">
            <span>Total Pemasukan (Lunas)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-100 mt-1">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-2">
            Kas Bulanan & Hibah Sponsorship
          </div>
        </div>

        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4">
          <div className="text-xs text-stone-400 flex items-center justify-between">
            <span>Total Pengeluaran Kegiatan</span>
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-100 mt-1">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-2">
            Logistik Ekspedisi & Peremajaan Alat
          </div>
        </div>

        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-4">
          <div className="text-xs text-stone-400">Kesiapan Tim & Kepatuhan Kas</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-100 mt-1">
            {gearReadinessPct}% Alat Layak
          </div>
          <div className="text-xs text-orange-400 mt-2 font-mono">
            {arrearsCount} Anggota Menunggak Kas · {expeditionLogs.length} Log Ekspedisi
          </div>
        </div>
      </div>

      {/* Team Performance Analytics Breakdown */}
      <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-stone-100">
              Analitik Performa Operasional Divisi Teknis (Real-Time)
            </h3>
            <p className="text-xs text-stone-400">
              Pemantauan jam terbang lapangan, penyelesaian agenda operasional, dan serapan anggaran per divisi.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-400">
            Total Agenda: {activities.length} Kegiatan · {activities.filter((a) => a.status === 'Selesai').length} Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {[
            { div: 'Gunung Hutan (Mountaineering)', progress: 92, metric: '5 Hari Lintas Argopuro · Diksar Siap' },
            { div: 'Penelusuran Gua (Caving SRT)', progress: 88, metric: 'Pemetaan Luweng Jaran (-90m Vertikal)' },
            { div: 'Panjat Tebing (Rock Climbing)', progress: 95, metric: 'Inspeksi 45 Carabiner & Jalur Citatah' },
            { div: 'Arung Jeram (River Rafting)', progress: 85, metric: '18 Km Jeram Serayu Grade III+ Selesai' },
          ].map((d) => (
            <div key={d.div} className="space-y-1.5 border-l-2 border-orange-500/80 pl-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-200">{d.div}</span>
                <span className="font-mono text-orange-400 tabular-nums">{d.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${d.progress}%` }} />
              </div>
              <p className="text-[11px] text-stone-400">{d.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input Form Modal / Drawer Inline */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#1C1613] border border-orange-500/40 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-semibold text-stone-100">
              Form Input Kas Bulanan / Rekap Nota Pengeluaran Kegiatan
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Nama Anggota / Divisi</label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Jenis Transaksi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'pemasukan' | 'pengeluaran')}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              >
                <option value="pemasukan">Pemasukan (Kas / Dana Usaha / Sponsor)</option>
                <option value="pengeluaran">Pengeluaran (Logistik / Perawatan Alat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Kategori Anggaran</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              >
                <option value="Kas Bulanan">Kas Bulanan Anggota</option>
                <option value="Logistik Ekspedisi">Logistik Ekspedisi</option>
                <option value="Perawatan Alat">Perawatan & Kalibrasi Alat</option>
                <option value="Sponsorship">Hibah / Sponsorship</option>
                <option value="Dana Usaha">Dana Usaha Organisasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                min={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Periode Bulan</label>
              <input
                type="text"
                required
                value={monthPeriod}
                onChange={(e) => setMonthPeriod(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Unggah Nama File Bukti Transfer / Nota</label>
              <input
                type="text"
                required
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="mis. NOTA-LOGISTIK-OKT.pdf"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-400 mb-1">Rincian Keterangan Transaksi</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-semibold text-xs rounded-lg transition-colors"
            >
              {submitting ? 'Menyimpan...' : 'Simpan ke Buku Kas'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar & Ledger Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg w-fit">
            {[
              { id: 'all', label: 'Semua Mutasi' },
              { id: 'pemasukan', label: 'Pemasukan Kas' },
              { id: 'pengeluaran', label: 'Pengeluaran Nota' },
              { id: 'menunggak', label: 'Status Menunggak' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-orange-500 text-stone-950 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-400 font-mono">
            Menampilkan {filteredFinance.length} transaksi buku kas
          </span>
        </div>

        <div className="bg-[#1C1613] border border-stone-800/90 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-mono">
                <th className="py-3 px-4">Anggota / Sumber</th>
                <th className="py-3 px-4">Kategori · Periode</th>
                <th className="py-3 px-4">Keterangan & Bukti Nota</th>
                <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3 px-4">Status Kas</th>
                <th className="py-3 px-4 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70">
              {filteredFinance.map((item) => (
                <tr key={item.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-stone-100">
                    <div>{item.memberName}</div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      Verifikator: {item.verifiedBy}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-300">
                    <span>{item.category}</span>
                    <span className="mx-1.5 text-stone-600">·</span>
                    <span className="text-stone-400 font-mono">{item.monthPeriod}</span>
                  </td>
                  <td className="py-3 px-4 text-stone-300 max-w-xs">
                    <div>{item.description}</div>
                    {item.receiptUrl && (
                      <div className="text-[11px] text-orange-400 font-mono flex items-center gap-1 mt-0.5">
                        <Receipt className="w-3 h-3" />
                        {item.receiptUrl}
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      item.type === 'pemasukan' ? 'text-emerald-400' : 'text-orange-400'
                    }`}
                  >
                    {item.type === 'pemasukan' ? '+' : '-'} Rp {Number(item.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    {item.paymentStatus === 'Menunggak' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Menunggak
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.paymentStatus === 'Menunggak' && (
                      <button
                        onClick={() => onVerifyFinance(item.id, 'Lunas')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded transition-colors whitespace-nowrap"
                      >
                        {role === 'admin' ? 'Verifikasi Lunas' : 'Bayar & Unggah Bukti'}
                      </button>
                    )}
                    {item.paymentStatus !== 'Menunggak' && (
                      <span className="text-[11px] font-mono text-stone-500">Tercatat LPJ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

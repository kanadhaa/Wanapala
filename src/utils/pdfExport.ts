import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportFinanceLPJToPDF(transactions: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('WANAPALA — LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN KAS', 14, 18);
  doc.setFontSize(10);
  doc.text(`Dicetak Otomatis: ${new Date().toLocaleString('id-ID')} | Periode Operasional: Oktober 2026`, 14, 25);

  const totalIn = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const totalOut = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  const balance = totalIn - totalOut;

  doc.setFontSize(11);
  doc.text(`Total Pemasukan: Rp ${totalIn.toLocaleString('id-ID')}`, 14, 34);
  doc.text(`Total Pengeluaran: Rp ${totalOut.toLocaleString('id-ID')}`, 85, 34);
  doc.text(`Saldo Akhir Kas: Rp ${balance.toLocaleString('id-ID')}`, 150, 34);

  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Nama / Sumber', 'Jenis', 'Kategori', 'Nominal (IDR)', 'Status', 'Verifikator']],
    body: transactions.map((t) => [
      `#${t.id}`,
      t.memberName,
      t.type.toUpperCase(),
      t.category,
      `Rp ${Number(t.amount).toLocaleString('id-ID')}`,
      t.paymentStatus,
      t.verifiedBy,
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [234, 88, 12] },
  });

  doc.save(`LPJ_Keuangan_Wanapala_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSOPDocumentToPDF(docItem: any) {
  const doc = new jsPDF();

  doc.setFontSize(15);
  doc.text(`DOKUMEN RESMI WANAPALA: ${docItem.codeNumber}`, 14, 18);
  doc.setFontSize(12);
  doc.text(docItem.title, 14, 26);
  doc.setFontSize(9.5);
  doc.text(`Kategori: ${docItem.category} | Tipe: ${docItem.docType} | Versi: ${docItem.version}`, 14, 33);

  doc.setFontSize(10.5);
  const splitSummary = doc.splitTextToSize(`Ringkasan Prosedur:\n${docItem.contentSummary}`, 180);
  doc.text(splitSummary, 14, 44);

  let checklist: string[] = [];
  try {
    checklist = JSON.parse(docItem.checklistItems || '[]');
  } catch {
    checklist = [docItem.checklistItems];
  }

  autoTable(doc, {
    startY: 68,
    head: [['No', 'Daftar Periksa Standar Operasional Prosedur (SOP) & Kepatuhan']],
    body: checklist.map((item, idx) => [`0${idx + 1}`, item]),
    styles: { fontSize: 9.5 },
    headStyles: { fillColor: [234, 88, 12] },
  });

  doc.save(`${docItem.codeNumber}_${docItem.title.replace(/\s+/g, '_')}.pdf`);
}

export function exportActivityAutoReportToPDF(activity: any, attendances: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(15);
  doc.text('BERITA ACARA & LAPORAN OTOMATIS KEGIATAN LAPANGAN', 14, 18);
  doc.setFontSize(11);
  doc.text(activity.title, 14, 26);
  doc.setFontSize(9.5);
  doc.text(
    `Kategori: ${activity.category} | Tanggal: ${activity.startDate} s/d ${activity.endDate} | Lokasi: ${activity.location}`,
    14,
    33
  );
  doc.text(`Koordinat: ${activity.coordinates} | PJ Lapangan: ${activity.picName}`, 14, 39);

  const summaryText =
    activity.autoReportSummary ||
    'Kegiatan berjalan lancar sesuai Rencana Operasi Perjalanan (ROP). Seluruh personel dan logistik kembali lengkap.';
  const splitReport = doc.splitTextToSize(`Hasil Evaluasi & Laporan Otomatis:\n${summaryText}`, 180);
  doc.text(splitReport, 14, 49);

  const actAttendances = attendances.filter((a) => a.activityId === activity.id);

  autoTable(doc, {
    startY: 72,
    head: [['No', 'Nama Personel', 'Status Kehadiran', 'Metode Verifikasi Presensi']],
    body:
      actAttendances.length > 0
        ? actAttendances.map((a, i) => [`${i + 1}`, a.memberName, a.rsvpStatus, a.checkInMethod])
        : [['1', activity.picName, 'Hadir', 'QR Code & Biometrik']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [234, 88, 12] },
  });

  doc.save(`Laporan_Kegiatan_${activity.qrCodeToken}.pdf`);
}

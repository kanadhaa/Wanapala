import { db } from './index.ts';
import {
  users,
  financeTransactions,
  activities,
  activityAttendances,
  announcements,
  documents,
  equipment,
  equipmentLoans,
  expeditionLogs,
  sosSignals,
} from './schema.ts';
import { desc, eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, fullName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        nia: `WNP-2026-${Math.floor(100 + Math.random() * 899)}`,
        role: 'admin',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function getAllOverviewData() {
  try {
    const [
      allUsers,
      allFinance,
      allActivities,
      allAttendances,
      allAnnouncements,
      allDocuments,
      allEquipment,
      allLoans,
      allLogs,
      allSos,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.id)),
      db.select().from(financeTransactions).orderBy(desc(financeTransactions.id)),
      db.select().from(activities).orderBy(desc(activities.id)),
      db.select().from(activityAttendances).orderBy(desc(activityAttendances.id)),
      db.select().from(announcements).orderBy(desc(announcements.id)),
      db.select().from(documents).orderBy(documents.id),
      db.select().from(equipment).orderBy(equipment.id),
      db.select().from(equipmentLoans).orderBy(desc(equipmentLoans.id)),
      db.select().from(expeditionLogs).orderBy(desc(expeditionLogs.id)),
      db.select().from(sosSignals).orderBy(desc(sosSignals.id)),
    ]);

    return {
      users: allUsers,
      finance: allFinance,
      activities: allActivities,
      attendances: allAttendances,
      announcements: allAnnouncements,
      documents: allDocuments,
      equipment: allEquipment,
      loans: allLoans,
      expeditionLogs: allLogs,
      sosSignals: allSos,
    };
  } catch (error) {
    console.error('Database query failed in getAllOverviewData:', error);
    throw new Error('Gagal memuat data operasional dari database.', { cause: error });
  }
}

export async function createFinanceEntry(data: {
  memberName: string;
  type: string;
  category: string;
  amount: number;
  monthPeriod: string;
  paymentStatus: string;
  receiptUrl: string;
  description: string;
  verifiedBy: string;
}) {
  try {
    const res = await db.insert(financeTransactions).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createFinanceEntry:', error);
    throw new Error('Gagal menyimpan transaksi keuangan.', { cause: error });
  }
}

export async function updateFinanceStatus(id: number, paymentStatus: string, verifiedBy: string) {
  try {
    const res = await db
      .update(financeTransactions)
      .set({ paymentStatus, verifiedBy })
      .where(eq(financeTransactions.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in updateFinanceStatus:', error);
    throw new Error('Gagal memperbarui status pembayaran.', { cause: error });
  }
}

export async function createActivityEntry(data: {
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  coordinates: string;
  picName: string;
  description: string;
  rundown: string;
  accessLevel: string;
}) {
  try {
    const qrCodeToken = `QR-WNP-${Date.now().toString().slice(-6)}`;
    const res = await db
      .insert(activities)
      .values({ ...data, status: 'Terjadwal', qrCodeToken })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createActivityEntry:', error);
    throw new Error('Gagal membuat jadwal kegiatan baru.', { cause: error });
  }
}

export async function completeActivityWithAutoReport(id: number, autoReportSummary: string) {
  try {
    const res = await db
      .update(activities)
      .set({ status: 'Selesai', autoReportSummary })
      .where(eq(activities.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in completeActivityWithAutoReport:', error);
    throw new Error('Gagal menyelesaikan kegiatan & laporan otomatis.', { cause: error });
  }
}

export async function recordAttendance(data: {
  activityId: number;
  memberName: string;
  rsvpStatus: string;
  checkInMethod: string;
}) {
  try {
    const res = await db.insert(activityAttendances).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in recordAttendance:', error);
    throw new Error('Gagal mencatat presensi anggota.', { cause: error });
  }
}

export async function createAnnouncementEntry(data: {
  title: string;
  category: string;
  content: string;
  senderName: string;
  senderRole: string;
  targetAudience: string;
}) {
  try {
    const res = await db
      .insert(announcements)
      .values({ ...data, readByList: JSON.stringify([data.senderName]) })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createAnnouncementEntry:', error);
    throw new Error('Gagal mengirim siaran jarkom.', { cause: error });
  }
}

export async function markAnnouncementRead(id: number, readerName: string) {
  try {
    const existing = await db.select().from(announcements).where(eq(announcements.id, id));
    if (!existing.length) throw new Error('Jarkom tidak ditemukan');
    let list: string[] = [];
    try {
      list = JSON.parse(existing[0].readByList || '[]');
    } catch {
      list = [];
    }
    if (!list.includes(readerName)) {
      list.push(readerName);
    }
    const res = await db
      .update(announcements)
      .set({ readByList: JSON.stringify(list) })
      .where(eq(announcements.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in markAnnouncementRead:', error);
    throw new Error('Gagal menandai status keterbacaan jarkom.', { cause: error });
  }
}

export async function createEquipmentLoanEntry(data: {
  equipmentId: number;
  equipmentName: string;
  borrowerName: string;
  borrowerType: string;
  quantity: number;
  purpose: string;
  borrowDate: string;
  returnDate: string;
}) {
  try {
    const eqItem = await db.select().from(equipment).where(eq(equipment.id, data.equipmentId));
    if (eqItem.length) {
      const newAvail = Math.max(0, eqItem[0].availableQty - data.quantity);
      await db.update(equipment).set({ availableQty: newAvail }).where(eq(equipment.id, data.equipmentId));
    }
    const res = await db
      .insert(equipmentLoans)
      .values({ ...data, status: 'Dipinjam' })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createEquipmentLoanEntry:', error);
    throw new Error('Gagal mencatat peminjaman logistik.', { cause: error });
  }
}

export async function returnEquipmentLoanEntry(loanId: number) {
  try {
    const existing = await db.select().from(equipmentLoans).where(eq(equipmentLoans.id, loanId));
    if (existing.length && existing[0].status !== 'Dikembalikan') {
      const loan = existing[0];
      const eqItem = await db.select().from(equipment).where(eq(equipment.id, loan.equipmentId));
      if (eqItem.length) {
        const restored = Math.min(eqItem[0].totalQty, eqItem[0].availableQty + loan.quantity);
        await db.update(equipment).set({ availableQty: restored }).where(eq(equipment.id, loan.equipmentId));
      }
    }
    const res = await db
      .update(equipmentLoans)
      .set({ status: 'Dikembalikan' })
      .where(eq(equipmentLoans.id, loanId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in returnEquipmentLoanEntry:', error);
    throw new Error('Gagal memproses pengembalian alat.', { cause: error });
  }
}

export async function createExpeditionLogEntry(data: {
  memberName: string;
  memberNia: string;
  expeditionTitle: string;
  discipline: string;
  locationName: string;
  elevationOrDepth: string;
  dateExecuted: string;
  durationDays: number;
  weatherCondition: string;
  routeNotes: string;
  teamLeader: string;
}) {
  try {
    const res = await db
      .insert(expeditionLogs)
      .values({ ...data, verifiedStatus: 'Terverifikasi Diklat' })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in createExpeditionLogEntry:', error);
    throw new Error('Gagal menyimpan catatan logbook ekspedisi.', { cause: error });
  }
}

export async function triggerSosSignalEntry(data: {
  senderName: string;
  senderNia: string;
  latitude: string;
  longitude: string;
  altitude: string;
  batteryLevel: string;
  emergencyType: string;
  message: string;
}) {
  try {
    const res = await db
      .insert(sosSignals)
      .values({
        ...data,
        status: 'AKTIF - SIAGA SAR',
        dispatchedTeam: 'Menunggu Konfirmasi Posko & DPO',
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in triggerSosSignalEntry:', error);
    throw new Error('Gagal memancarkan sinyal darurat SOS.', { cause: error });
  }
}

export async function updateSosSignalStatus(id: number, status: string, dispatchedTeam: string) {
  try {
    const res = await db
      .update(sosSignals)
      .set({ status, dispatchedTeam })
      .where(eq(sosSignals.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in updateSosSignalStatus:', error);
    throw new Error('Gagal memperbarui status operasi SAR.', { cause: error });
  }
}

export async function registerUserBiometric(userId: number, credentialId: string) {
  try {
    const res = await db
      .update(users)
      .set({ biometricRegistered: true, biometricCredentialId: credentialId })
      .where(eq(users.id, userId))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed in registerUserBiometric:', error);
    throw new Error('Gagal mendaftarkan kredensial biometrik pengguna.', { cause: error });
  }
}

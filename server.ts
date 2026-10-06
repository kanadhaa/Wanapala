import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getAllOverviewData,
  createFinanceEntry,
  updateFinanceStatus,
  createActivityEntry,
  completeActivityWithAutoReport,
  recordAttendance,
  createAnnouncementEntry,
  markAnnouncementRead,
  createEquipmentLoanEntry,
  returnEquipmentLoanEntry,
  createExpeditionLogEntry,
  triggerSosSignalEntry,
  updateSosSignalStatus,
  registerUserBiometric,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Public & Operational Overview Route (supports offline cache & instant preview + authenticated user sync)
  app.get('/api/overview', async (req, res) => {
    try {
      const data = await getAllOverviewData();
      res.json(data);
    } catch (error: any) {
      console.error('Error in GET /api/overview:', error);
      res.status(500).json({ error: error.message || 'Gagal memuat data Wanapala App' });
    }
  });

  // Sync Firebase Auth User to PostgreSQL
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Tidak terautentikasi' });
      }
      const userRecord = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'anggota@wanapala.org',
        req.user.name
      );
      res.json({ user: userRecord });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Gagal sinkronisasi profil anggota' });
    }
  });

  // Finance Transactions
  app.post('/api/finance', async (req, res) => {
    try {
      const entry = await createFinanceEntry({
        memberName: req.body.memberName || 'Anggota Wanapala',
        type: req.body.type || 'pemasukan',
        category: req.body.category || 'Kas Bulanan',
        amount: Number(req.body.amount) || 50000,
        monthPeriod: req.body.monthPeriod || 'Oktober 2026',
        paymentStatus: req.body.paymentStatus || 'Lunas',
        receiptUrl: req.body.receiptUrl || 'BUKTI-TF-2026.pdf',
        description: req.body.description || 'Iuran Kas Organisasi',
        verifiedBy: req.body.verifiedBy || 'Bendahara Umum',
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/finance/:id/status', async (req, res) => {
    try {
      const updated = await updateFinanceStatus(
        Number(req.params.id),
        req.body.paymentStatus || 'Lunas',
        req.body.verifiedBy || 'Bendahara Umum'
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activities & Auto-Report
  app.post('/api/activities', async (req, res) => {
    try {
      const entry = await createActivityEntry({
        title: req.body.title,
        category: req.body.category || 'Ekspedisi',
        startDate: req.body.startDate,
        endDate: req.body.endDate || req.body.startDate,
        location: req.body.location,
        coordinates: req.body.coordinates || '-7.1568, 107.4021',
        picName: req.body.picName,
        description: req.body.description,
        rundown: req.body.rundown || '07:00 Apel Persiapan | 09:00 Pelaksanaan Lapangan | 16:00 Evaluasi',
        accessLevel: req.body.accessLevel || 'Semua',
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/activities/:id/complete', async (req, res) => {
    try {
      const updated = await completeActivityWithAutoReport(
        Number(req.params.id),
        req.body.autoReportSummary
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/activities/:id/attendance', async (req, res) => {
    try {
      const entry = await recordAttendance({
        activityId: Number(req.params.id),
        memberName: req.body.memberName,
        rsvpStatus: req.body.rsvpStatus || 'Hadir',
        checkInMethod: req.body.checkInMethod || 'QR Code',
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Announcements (Jarkom)
  app.post('/api/announcements', async (req, res) => {
    try {
      const entry = await createAnnouncementEntry({
        title: req.body.title,
        category: req.body.category || 'Info Kegiatan',
        content: req.body.content,
        senderName: req.body.senderName || 'Pengurus Harian',
        senderRole: req.body.senderRole || 'Admin Operasional',
        targetAudience: req.body.targetAudience || 'Seluruh Anggota',
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/announcements/:id/read', async (req, res) => {
    try {
      const updated = await markAnnouncementRead(
        Number(req.params.id),
        req.body.readerName || 'Anggota Aktif'
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Equipment Loans
  app.post('/api/equipment/loans', async (req, res) => {
    try {
      const entry = await createEquipmentLoanEntry({
        equipmentId: Number(req.body.equipmentId),
        equipmentName: req.body.equipmentName,
        borrowerName: req.body.borrowerName,
        borrowerType: req.body.borrowerType || 'Internal Anggota',
        quantity: Number(req.body.quantity) || 1,
        purpose: req.body.purpose,
        borrowDate: req.body.borrowDate,
        returnDate: req.body.returnDate,
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/equipment/loans/:id/return', async (req, res) => {
    try {
      const updated = await returnEquipmentLoanEntry(Number(req.params.id));
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Expedition Logbook
  app.post('/api/expeditions', async (req, res) => {
    try {
      const entry = await createExpeditionLogEntry({
        memberName: req.body.memberName,
        memberNia: req.body.memberNia || 'WNP-2023-014',
        expeditionTitle: req.body.expeditionTitle,
        discipline: req.body.discipline || 'Pendakian Gunung',
        locationName: req.body.locationName,
        elevationOrDepth: req.body.elevationOrDepth || '3.000 mdpl',
        dateExecuted: req.body.dateExecuted,
        durationDays: Number(req.body.durationDays) || 3,
        weatherCondition: req.body.weatherCondition || 'Cerah Berawan',
        routeNotes: req.body.routeNotes,
        teamLeader: req.body.teamLeader,
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SOS Signals
  app.post('/api/sos', async (req, res) => {
    try {
      const entry = await triggerSosSignalEntry({
        senderName: req.body.senderName,
        senderNia: req.body.senderNia,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        altitude: req.body.altitude || '2.450 mdpl',
        batteryLevel: req.body.batteryLevel || '82%',
        emergencyType: req.body.emergencyType || 'Evakuasi Segera',
        message: req.body.message,
      });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/sos/:id/status', async (req, res) => {
    try {
      const updated = await updateSosSignalStatus(
        Number(req.params.id),
        req.body.status,
        req.body.dispatchedTeam
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Biometric WebAuthn Registration
  app.post('/api/users/:id/biometric', async (req, res) => {
    try {
      const updated = await registerUserBiometric(
        Number(req.params.id),
        req.body.credentialId || `WEBAUTHN-${Date.now()}`
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch Offline Sync Endpoint
  app.post('/api/sync-offline', async (req, res) => {
    try {
      const queue = Array.isArray(req.body.queue) ? req.body.queue : [];
      const results = [];
      for (const item of queue) {
        if (item.actionType === 'finance') {
          results.push(await createFinanceEntry(item.payload));
        } else if (item.actionType === 'expedition') {
          results.push(await createExpeditionLogEntry(item.payload));
        } else if (item.actionType === 'sos') {
          results.push(await triggerSosSignalEntry(item.payload));
        } else if (item.actionType === 'jarkom') {
          results.push(await createAnnouncementEntry(item.payload));
        }
      }
      res.json({ syncedCount: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wanapala App Server running on http://localhost:${PORT}`);
  });
}

startServer();

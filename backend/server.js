import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import bloodBankRoutes from './routes/bloodBankRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import matchingRoutes from './routes/matchingRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
	res.json({ success: true, message: 'LifeLink API is running', timestamp: new Date().toISOString() });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/blood-banks', bloodBankRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

// Serve frontend build in production/single-command mode
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
	app.use(express.static(distPath));
	// API 404 must stay JSON
	app.use('/api', notFound);
	app.get(/^(?!\/api).*/, (_req, res) => {
		res.sendFile(path.join(distPath, 'index.html'));
	});
} else {
	app.use(notFound);
}

app.use(errorHandler);

async function start() {
	const skipDb = process.env.SKIP_DB === '1' || process.env.SKIP_DB === 'true' || process.env.NODE_ENV === 'test';
	if (!skipDb) {
		await connectDB();
	} else {
		console.log('[api] SKIP_DB/test: starting without database connection');
	}
	const server = app.listen(PORT, () => {
		console.log(`[api] LifeLink server listening on port ${PORT}`);
		console.log(`[api] CORS origin: ${CLIENT_ORIGIN}`);
		if (fs.existsSync(distPath)) console.log(`[api] Serving frontend from ${distPath}`);
	});
	return server;
}

if (process.env.NODE_ENV !== 'test' && process.env.SKIP_DB !== '1') {
	start().catch((err) => {
		console.error('[api] failed to start:', err);
		process.exit(1);
	});
}

export { app, start };

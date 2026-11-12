import mongoose from 'mongoose';

export async function connectDB() {
	const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lifelink';
	try {
		const conn = await mongoose.connect(uri);
		console.log(`[db] connected to ${conn.connection.host}/${conn.connection.name}`);
	} catch (err) {
		console.error('[db] connection error:', err.message);
		process.exit(1);
	}

	mongoose.connection.on('disconnected', () => {
		console.warn('[db] disconnected');
	});
}

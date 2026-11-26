import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lifelink';
const DB_NAME = process.env.DB_NAME || 'lifelink';
const PORT = Number(process.env.DB_VIEWER_PORT || 5050);
const LIMIT = Number(process.env.DB_VIEWER_LIMIT || 100);

const client = new MongoClient(MONGO_URI);
const app = express();

function esc(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function fmt(value) {
	if (value === null || value === undefined) return '<span class="muted">—</span>';
	if (value instanceof ObjectId) return `<code>${esc(value.toHexString())}</code>`;
	if (value instanceof Date) return esc(value.toISOString());
	if (Array.isArray(value)) return esc(JSON.stringify(value));
	if (typeof value === 'object') return esc(JSON.stringify(value));
	return esc(value);
}

app.get('/', async (_req, res) => {
	try {
		const db = client.db(DB_NAME);
		const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
		const rows = [];
		for (const name of collections) {
			const count = await db.collection(name).countDocuments();
			rows.push(`<tr><td><a href="/collection/${encodeURIComponent(name)}">${esc(name)}</a></td><td class="num">${count}</td></tr>`);
		}
		res.set('Content-Type', 'text/html');
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Database Tables</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
h1{font-size:20px;margin:0 0 16px}
a{color:#fda4af;text-decoration:none}a:hover{text-decoration:underline}
table{border-collapse:collapse;width:100%;background:#111827;border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid #1f2937;font-size:13px;vertical-align:top}
th{background:#1f2937;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-size:11px}
td.num{text-align:right;font-variant-numeric:tabular-nums}
code{background:#0b1220;padding:2px 6px;border-radius:6px;font-size:12px;color:#a5b4fc}
.muted{color:#475569}
nav{margin:12px 0 20px;font-size:13px}
</style></head><body>
<h1>🗄️ LifeLink Database — ${esc(DB_NAME)}</h1>
<nav><a href="/">All tables</a></nav>
<table><thead><tr><th>Collection (table)</th><th class="num">Documents</th></tr></thead><tbody>${rows.join('')}</tbody></table>
</body></html>`);
	} catch (err) {
		res.status(500).send(`Error: ${esc(err.message)}`);
	}
});

app.get('/collection/:name', async (req, res) => {
	try {
		const name = req.params.name;
		const db = client.db(DB_NAME);
		const docs = await db.collection(name).find({}).limit(LIMIT).toArray();
		if (docs.length === 0) {
			res.set('Content-Type', 'text/html');
			res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title></head><body style="font-family:system-ui;padding:24px"><p><a href="/">← Back</a></p><h1>${esc(name)}</h1><p class="muted">No documents.</p></body></html>`);
			return;
		}
		const keys = [...new Set(docs.flatMap((d) => Object.keys(d)))];
		const head = keys.map((k) => `<th>${esc(k)}</th>`).join('');
		const body = docs.map((d) => `<tr>${keys.map((k) => `<td>${fmt(d[k])}</td>`).join('')}</tr>`).join('');
		res.set('Content-Type', 'text/html');
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
h1{font-size:20px;margin:0 0 16px}a{color:#fda4af;text-decoration:none}
nav{margin:12px 0 20px;font-size:13px}
.wrap{overflow:auto;border-radius:12px}
table{border-collapse:collapse;background:#111827;min-width:100%}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid #1f2937;font-size:13px;vertical-align:top;white-space:nowrap;max-width:340px;overflow:hidden;text-overflow:ellipsis}
th{background:#1f2937;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-size:11px;position:sticky;top:0}
code{background:#0b1220;padding:2px 6px;border-radius:6px;font-size:12px;color:#a5b4fc}
.muted{color:#475569}
</style></head><body>
<nav><a href="/">← All tables</a></nav>
<h1>${esc(name)} <span class="muted" style="font-size:13px">(${docs.length}${docs.length >= LIMIT ? '+' : ''} shown, limit ${LIMIT})</span></h1>
<div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
</body></html>`);
	} catch (err) {
		res.status(500).send(`Error: ${esc(err.message)}`);
	}
});

await client.connect();
app.listen(PORT, () => {
	console.log(`[db-viewer] serving tables at http://localhost:${PORT}`);
});

function shutdown() {
	client.close().finally(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
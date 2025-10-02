import { Router } from 'express';
import { getHome } from '../controllers/tenantController.js';
import { query } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
	if (!req.session || !req.session.user) return res.redirect('/auth/login');
	return getHome(req, res);
});

// Simple health check with DB
router.get('/healthz', async (req, res) => {
	try {
		await query('SELECT 1');
		res.json({ status: 'ok' });
	} catch (e) {
		res.status(500).json({ status: 'error', message: e.message });
	}
});

export default router;

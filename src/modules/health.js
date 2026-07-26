import { Router } from 'express';
import { query } from '../db.js';
const router = Router();
router.get('/', async (_req, res) => {
  const db = await query('SELECT now() AS now');
  res.json({ ok: true, database: true, time: db.rows[0].now });
});
export default router;

import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    version: config.appVersion,
    commit: config.buildCommit,
    buildTime: config.buildTime,
  });
});

export default router;

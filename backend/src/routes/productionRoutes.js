import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import { createProductionBatch, getProductionBatches } from '../controllers/productionController.js';

const router = express.Router();

router.get('/', protect, adminOnly, getProductionBatches);
router.post('/', protect, adminOnly, createProductionBatch);

export default router;

import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  adjustRawMaterialStock,
  createRawMaterial,
  deleteRawMaterial,
  getRawMaterialMovements,
  getRawMaterials,
  purchaseRawMaterial,
  updateRawMaterial,
} from '../controllers/rawMaterialController.js';

const router = express.Router();

router.get('/', protect, adminOnly, getRawMaterials);
router.get('/movements', protect, adminOnly, getRawMaterialMovements);
router.post('/', protect, adminOnly, createRawMaterial);
router.post('/purchase', protect, adminOnly, purchaseRawMaterial);
router.post('/adjust', protect, adminOnly, adjustRawMaterialStock);
router.put('/:id', protect, adminOnly, updateRawMaterial);
router.delete('/:id', protect, adminOnly, deleteRawMaterial);

export default router;

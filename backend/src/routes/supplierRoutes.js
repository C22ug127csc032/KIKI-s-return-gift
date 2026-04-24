import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', protect, adminOnly, getSuppliers);
router.post('/', protect, adminOnly, createSupplier);
router.put('/:id', protect, adminOnly, updateSupplier);
router.delete('/:id', protect, adminOnly, deleteSupplier);

export default router;

import express from 'express';
import {
  createOccasion,
  deleteOccasion,
  getAdminOccasions,
  getOccasions,
  updateOccasion,
} from '../controllers/occasionController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { publicApiLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

router.get('/', publicApiLimiter, getOccasions);
router.get('/admin/all', protect, adminOnly, getAdminOccasions);
router.post('/', protect, adminOnly, createOccasion);
router.put('/:id', protect, adminOnly, updateOccasion);
router.delete('/:id', protect, adminOnly, deleteOccasion);

export default router;

import { Router } from 'express';
import { getTenants, getCreateTenant, postCreateTenant, getTenantDetail, getEditTenant, postUpdateTenant, postDeleteTenant } from '../controllers/tenantController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getTenants);
router.get('/new', requireAuth, getCreateTenant);
router.post('/', requireAuth, postCreateTenant);
router.get('/:id', requireAuth, getTenantDetail);
router.get('/:id/edit', requireAuth, getEditTenant);
router.post('/update', requireAuth, postUpdateTenant);
router.post('/delete', requireAuth, postDeleteTenant);

export default router;

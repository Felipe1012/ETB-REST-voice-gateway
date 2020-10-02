const router = require('express').Router();
const { kubernetes } = require('../../controllers');

router.get('/pods', kubernetes.pods);
router.get('/tenants', kubernetes.tenants);
router.post('/tenants', kubernetes.applyTenant);
router.delete('/tenants/:id', kubernetes.delTenant);

module.exports = router;

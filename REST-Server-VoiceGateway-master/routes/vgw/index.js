const router = require('express').Router();
const { vgw } = require('../../controllers');

router.post('/startOutbound', vgw.startOutbound);

module.exports = router;

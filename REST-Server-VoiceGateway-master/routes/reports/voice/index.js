const router = require('express').Router();
const { reports } = require('../../../controllers')

router.get('/general', reports.ivr.general.generic);
router.get('/general/calls', reports.ivr.general.calls);
router.get('/general/tmo', reports.ivr.general.tmo);
router.get('/general/tmr', reports.ivr.general.tmr);
router.get('/general/quality', reports.ivr.general.quality);
router.get('/general/contention', reports.ivr.general.contention);
router.get('/general/latency', reports.ivr.general.latency);
router.get('/general/transfers', reports.ivr.general.transfers);
router.get('/general/failures', reports.ivr.general.failures);



router.get('/intents', reports.ivr.intents);
router.get('/latency', reports.ivr.latency);
router.get('/quality', reports.ivr.quality);
router.get('/calls', reports.ivr.calls);
module.exports = router;
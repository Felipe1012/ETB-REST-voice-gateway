const generic = require('./generic');
const calls = require('./calls');
const tmo = require('./tmo');
const tmr = require('./tmr');
const quality = require('./quality');
const contention = require('./contention');
const latency = require('./latency');
const transfers = require('./transfers');
const failures = require('./failures');


module.exports = {
    generic,
    calls,
    tmo,
    tmr,
    quality,
    contention,
    latency,
    transfers,
    failures,
}
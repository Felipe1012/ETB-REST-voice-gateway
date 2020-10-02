const router = require('express').Router();
const { users } = require('../../controllers');

router.delete('/:id', users.del);
router.put('/:id', users.put);
router.get('/', users.get);
router.post('/', users.post);

module.exports = router;

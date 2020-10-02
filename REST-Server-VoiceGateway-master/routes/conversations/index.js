const router = require('express').Router();
const { conversations } = require('../../controllers');

router.get('/voice', conversations.voice.get);
router.get('/voice/:conversationId', conversations.voice.one);
router.get('/voice/:conversationId/audio', conversations.voice.audio.get);


module.exports = router;
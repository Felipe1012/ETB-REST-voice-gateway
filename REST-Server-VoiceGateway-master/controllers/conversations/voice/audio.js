const { cos } = require("../../../services");

async function get(req, res, next) {
    const { conversationId } = req.params;

    let audio;
    conv = conversationId + "-audio"
    try {
        if (cos.getStatus().client_status == "READY") {
            audio = await cos.getSignedUrl('audios', conv);
            res.json(audio)
        } else {
            res.sendFile(conv + ".wav", { root: '/recordings', headers: { 'Content-Type': 'audio/x-wav' } });
        }

    } catch (error) {
        // console.log(error);
        next(error);
    }
}

module.exports = {
    get,
}
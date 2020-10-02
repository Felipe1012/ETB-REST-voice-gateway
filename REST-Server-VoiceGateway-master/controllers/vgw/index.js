const _ = require('lodash');
const axios = require('axios')
async function startOutbound(req, res, next) {
    const { phoneNumber, tenantURI, context } = req.body;
    let config
    config = {
    	to: "sip:" + phoneNumber + "@ignaciotesting.pstn.twilio.com",
	from: "sip:+" + tenantURI + "@75.126.157.203:5060",
	context: context
    }
    console.log(config)
    try {
         axios.post('http://75.126.157.203:9080/vgw/outboundCalls/+56233046259/startOutboundCall', config)
	    .then(data => res.json(data))
	    .catch(err => res.send(err))
    } catch (error) {
        next(error);
    }
}


module.exports = {
   startOutbound,
};

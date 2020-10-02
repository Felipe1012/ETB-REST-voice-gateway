const AWS = require('ibm-cos-sdk');
require('dotenv').config();
const CLIENT_STATUS = {
    NOT_READY: 'NOT READY',
    READY: 'READY',
};
let STATUS = CLIENT_STATUS.NOT_READY;
const getStatus = () => {
    return {
        client_status: STATUS
    };
};

// INITIALIZATION
try {
    var cos = new AWS.S3({
        endpoint: process.env.COS_ENDPOINT,
        accessKeyId: process.env.COS_ACCESSKEYID,
        secretAccessKey: process.env.COS_SECRETACCESSKEY,
        ibmAuthEndpoint: process.env.COS_IBMAUTHENDPOINT,
        serviceInstanceId: process.env.COS_SERVICEINSTANCEID,
    });
    STATUS = CLIENT_STATUS.READY;
} catch (error) {
    console.log(error)
}

function getSignedUrl(bucket, key) {
    return new Promise(function(resolve, reject) {
        cos.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key
        }, function(err, url) {
            if (err) {
                return reject(err)
            } else {
                return resolve(url)
            }

        })
    })
}

module.exports = {
    getSignedUrl,
    getStatus
}
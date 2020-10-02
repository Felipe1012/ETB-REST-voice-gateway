const { elasticsearch } = require("../../../services");
const audio = require("./audio");
const moment = require("moment");
const _ = require("lodash");

async function get(req, res, next) {
    const { startDate, endDate, size, conversationId, phoneNumber } = req.query;

    try {
        let count;
        if (size === "all") {
            count = (await elasticsearch.count({
                index: process.env.ES_CDR_INDEX || 'cdr'
            })).count;
        }
        let query = [{
            range: {
                time: {
                    gte: startDate ?
                        moment(`${startDate}T00`).format("X") : startDate,
                    lte: endDate ? moment(`${endDate}T23:59:59`).format("X") : endDate
                }
            }
        }]
        if (conversationId) {
            query.push({
                nested: {
                    path: "event",
                    query: {
                        term: {
                            "event.globalSessionID": conversationId
                        }
                    },
                }
            })
        }
        if (phoneNumber) {
            query.push({
                nested: {
                    path: "event",
                    query: {
                        wildcard: {
                            "event.sipFromURI.keyword": "*" + phoneNumber + "*"
                        }
                    }
                }
            })
        }

        const response = await elasticsearch.msearch({
            body: [{
                    index: process.env.ES_CDR_INDEX || 'cdr',
                    type: "_doc",
                },
                {
                    _source: ["event", "time"],
                    size: count > 1000 ? 1000 : count || size || 10,
                    sort: [{
                        time: {
                            order: "desc"
                        }
                    }],
                    query: {
                        bool: { must: query }
                    }
                }
                /*,
                                {
                                    index: process.env.ES_HOST_IVR_CDR_CONV,
                                    type: "_doc",
                                },
                                {
                                    size: 0,
                                    query: {
                                        range: {
                                            time: {
                                                gte: startDate ?
                                                    moment(`${startDate}T00`).format("X") : startDate,
                                                lte: endDate ? moment(`${endDate}T23:59:59`).format("X") : endDate
                                            }
                                        }
                                    },
                                    aggs: {
                                        by_context: {
                                            nested: {
                                                path: "event.context"
                                            },
                                            aggs: {
                                                by_group: {
                                                    terms: {
                                                        field: "event.context.vgwSessionID.keyword",
                                                        size: count > 1000 ? 1000 : count || size || 10
                                                    },
                                                    aggs: {
                                                        group_docs: {
                                                            reverse_nested: {},
                                                            aggs: {
                                                                group: {
                                                                    top_hits: {
                                                                        size: 1,
                                                                        sort: [{
                                                                            time: {
                                                                                order: "desc"
                                                                            }
                                                                        }],
                                                                        _source: ["event.context"]
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } */
            ]
        });
        /*
        // Información de Assistant
        informacion = response.responses[1].aggregations.by_context.by_group.buckets.map(x => ({
            conversationId: x.key,
            motivo: x.group_docs.group.hits.hits[0]._source.event.context.motivo ? x.group_docs.group.hits.hits[0]._source.event.context.motivo : null,
            resultado_gestion: x.group_docs.group.hits.hits[0]._source.event.context.resultado_gestion ? x.group_docs.group.hits.hits[0]._source.event.context.resultado_gestion : null,
            fecha_compromiso: x.group_docs.group.hits.hits[0]._source.event.context.fecha_compromiso ? x.group_docs.group.hits.hits[0]._source.event.context.fecha_compromiso : null,
            fecha_vencimiento: x.group_docs.group.hits.hits[0]._source.event.context.fecha_vencimiento ? x.group_docs.group.hits.hits[0]._source.event.context.fecha_vencimiento : null,
            producto_cliente: x.group_docs.group.hits.hits[0]._source.event.context.producto_cliente ? x.group_docs.group.hits.hits[0]._source.event.context.producto_cliente : null,
            bloqueo: x.group_docs.group.hits.hits[0]._source.event.context.bloqueo ? x.group_docs.group.hits.hits[0]._source.event.context.bloqueo : null,
            motivo2: x.group_docs.group.hits.hits[0]._source.event.context.motivo2 ? x.group_docs.group.hits.hits[0]._source.event.context.motivo2 : null,
            solicita_llamado: x.group_docs.group.hits.hits[0]._source.event.context.solicita_llamado ? x.group_docs.group.hits.hits[0]._source.event.context.solicita_llamado : null
        }));
        */
        // Información de CDR	
        conversations = response.responses[0].hits.hits.map(x => ({
            conversationId: x._source.event.globalSessionID,
            startTime: moment.unix(x._source.time).format("DD-MM-YYYY HH:mm"),
            duration: Math.round(x._source.event.callLength / 1000),
            sipFromURI: x._source.event.sipFromURI,
            sipToURI: x._source.event.sipToURI,
            failureOccurred: x._source.event.failureOccurred,
            phoneNumber: x._source.event.sipFromURI.substring(
                x._source.event.sipFromURI.indexOf(":") + 1,
                x._source.event.sipFromURI.indexOf("@")
            ).split(".").pop()
        }));
        /*
        var conversations = _.map(conversations, function(item) {
            return _.extend(item, _.find(informacion, { conversationId: item.conversationId }));
        });
        */
        res.status(200).json(conversations);
    } catch (error) {
        next(error);
    }
}

async function one(req, res, next) {
    let response;
    try {
        response = await elasticsearch.msearch({
            body: [{
                    index: process.env.ES_CONV_INDEX || 'conv',
                    type: "_doc"
                },
                {
                    sort: ["time"],
                    _source: [
                        "event.input.text",
                        "event.output.text",
                        "event.context.vgwSessionID",
                        "event.intents",
                        "event.entities",
                        "time"
                    ],
                    size: 15,
                    query: {
                        nested: {
                            path: "event.context",
                            query: {
                                term: {
                                    "event.context.vgwSessionID.keyword": req.params.conversationId
                                }
                            },
                        }
                    },
                    aggs: {
                        by_intents: {
                            nested: {
                                path: "event.intents"
                            },
                            aggs: {
                                intents_count: {
                                    terms: {
                                        field: "event.intents.intent.keyword"
                                    }
                                }
                            }
                        },
                        by_entities: {
                            nested: {
                                path: "event.entities"
                            },
                            aggs: {
                                entity_count: {
                                    terms: {
                                        field: "event.entities.entity.keyword"
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    index: process.env.ES_CDR_INDEX || 'cdr',
                    type: "_doc",
                },
                {
                    _source: ["event", "time"],
                    size: 15,
                    sort: [{
                        time: {
                            order: "desc"
                        }
                    }],
                    query: {
                        bool: {
                            must: {
                                nested: {
                                    path: "event",
                                    query: {
                                        term: {
                                            "event.globalSessionID": req.params.conversationId
                                        }
                                    },
                                }
                            }
                        }
                    }
                },

            ]
        });

        let messages = _.at(response, "responses[0].hits.hits");
        messages = _.map(messages[0], "_source");
        conversation = {
            messages: _.flatMap(messages, x => [{
                    type: "Usuario",
                    text: x.event.input.text != null ? x.event.input.text.toString() : null,
                    intents: x.event.intents,
                    entities: _.flatMap(x.event.entities, x => [{
                        value: x.value,
                        entity: x.entity
                    }])
                },
                {
                    type: "Bot",
                    text: x.event.output.text != null ?
                        x.event.output.text.toString().replace(/<(.|\n)*?>/g, "") : null
                }
            ]),
            intents_count: response.responses[0].aggregations.by_intents.intents_count.buckets.map(
                i => ({
                    name: i.key
                        .split("_")
                        .join(" ")
                        .toLowerCase(),
                    count: i.doc_count
                })
            ),
            entities_count: response.responses[0].aggregations.by_entities.entity_count.buckets.map(
                i => ({
                    name: i.key,
                    count: i.doc_count
                })
            )
        }
        conversation.messages = _.remove(
            conversation.messages,
            x => x.text != "init" || x.text != null
        );


        callDetails = response.responses[1].hits.hits.map(x => ({
            conversationId: x._source.event.globalSessionID,
            startTime: moment.unix(x._source.time).format("DD-MM-YYYY HH:mm"),
            duration: Math.round(x._source.event.callLength / 1000),
            sipFromURI: x._source.event.sipFromURI,
            sipToURI: x._source.event.sipToURI,
            endReason: x._source.event.endReason,
            echoDetected: x._source.event.echoDetected,
            maxConvTransaction: x._source.event.maxConvTransaction,
            maxTTSTransaction: x._source.event.maxTTSTransaction,
            maxSTTTransaction: x._source.event.maxSTTTransaction,
            failureDetails: x._source.event.failureDetails,
            warnings: x._source.event.warnings,
            failureOccurred: x._source.event.failureOccurred,
            phoneNumber: x._source.event.sipFromURI.substring(
                x._source.event.sipFromURI.indexOf(":") + 1,
                x._source.event.sipFromURI.indexOf("@")
            ).split(".").pop()
        }));


        res.status(200).json({
            ...conversation,
            ... { callDetails: callDetails }
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    get,
    one,
    audio,
};
const { elasticsearch } = require("../../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate } = req.query;

    try {
        const response = await elasticsearch.search({
            index: process.env.ES_CDR_INDEX || 'cdr',
            type: "_doc",
            body: {
                size: 0,
                query: {
                    range: {
                        time: {
                            gte: startDate ?
                                moment(`${startDate}T00`).format("X") :
                                startDate,
                            lte: endDate ? moment(`${endDate}T23:59:59`).format("X") : endDate
                        }
                    }
                },
                aggs: {
                    kpis: {
                        nested: {
                            path: "event"
                        },
                        aggs: {
                            to_conversations: {
                                nested: {
                                    path: "event.conversations"
                                },
                                aggs: {
                                    numberOfTurns: {
                                        avg: {
                                            field: "event.conversations.numberOfTurns"
                                        }
                                    },
                                    contention: {
                                        filters: {
                                            filters: {
                                                unattended: {
                                                    match: {
                                                        "event.conversations.numberOfTurns": 0
                                                    }
                                                },
                                                unattended1: {
                                                    match: {
                                                        "event.conversations.numberOfTurns": 1
                                                    }
                                                },
                                                transfer: {
                                                    match: {
                                                        "event.conversations.allIntents": "transfer"
                                                    }
                                                }
                                            },
                                            other_bucket_key: "attended"
                                        }
                                    },
                                    noIntents: {
                                        missing: {
                                            field: "event.conversations.allIntents"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            name: "contention",
            value:
                (((response.aggregations.kpis.to_conversations.contention.buckets.attended
                            .doc_count -
                            response.aggregations.kpis.to_conversations.noIntents.doc_count) /
                        response.aggregations.kpis.to_conversations.doc_count) *
                    100).toFixed(2)
        });
    } catch (error) {
        next(error);
    }
};
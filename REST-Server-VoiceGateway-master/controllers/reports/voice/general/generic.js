const { elasticsearch } = require("../../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate } = req.query;

    try {
        const response = await elasticsearch.msearch({
            body: [{
                    index: process.env.ES_CDR_INDEX || 'cdr',
                    type: "_doc"
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
                        kpis: {
                            nested: {
                                path: "event"
                            },
                            aggs: {
                                tmo: {
                                    avg: {
                                        field: "event.callLength"
                                    }
                                },
                                totalCalls: {
                                    value_count: {
                                        field: "event.globalSessionID"
                                    }
                                },
                                tmr: {
                                    avg: {
                                        field: "event.setupTime"
                                    }
                                },
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
                },
                {
                    index: process.env.ES_CONV_INDEX || 'conv',
                    type: "_doc"
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
                        to_context: {
                            nested: {
                                path: "event.context"
                            },
                            aggs: {
                                avg_confidenceSTT: {
                                    avg: {
                                        field: "event.context.vgwSTTResponse.results.alternatives.confidence"
                                    }
                                },
                                conv: {
                                    reverse_nested: {},
                                    aggs: {
                                        to_intents: {
                                            nested: {
                                                path: "event.intents"
                                            },
                                            aggs: {
                                                avg_confidenceConv: {
                                                    avg: {
                                                        field: "event.intents.confidence"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        });

        const cdrResult = response.responses[0].aggregations.kpis;
        const convResult = response.responses[1].aggregations.to_context;


        res.status(200).json({
            total_calls: cdrResult.totalCalls.value,
            tmo: cdrResult.tmo.value,
            tmr: cdrResult.tmr.value,
            avg_confidence_stt: convResult.avg_confidenceSTT.value,
            avg_confidence_conv: convResult.conv.to_intents.avg_confidenceConv.value,
            call_quality: convResult.avg_confidenceSTT.value * 0.3 +
                convResult.conv.to_intents.avg_confidenceConv.value * 0.7,
            answered: cdrResult.to_conversations.contention.buckets.attended.doc_count,
            transfer: cdrResult.to_conversations.contention.buckets.transfer.doc_count,
            not_answered: cdrResult.to_conversations.contention.buckets.unattended.doc_count,
            no_intents: cdrResult.to_conversations.noIntents.doc_count,
            contention_rate:
                ((cdrResult.to_conversations.contention.buckets.attended.doc_count -
                        cdrResult.to_conversations.noIntents.doc_count) /
                    cdrResult.to_conversations.doc_count) *
                100
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
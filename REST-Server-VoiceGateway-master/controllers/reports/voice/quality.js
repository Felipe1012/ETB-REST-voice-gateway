const { elasticsearch } = require("../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate, histogramInterval } = req.query;

    try {
        response = (await elasticsearch.search({
            index: process.env.ES_CONV_INDEX || 'conv',
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
                    daily_quality: {
                        date_histogram: {
                            field: "time",
                            interval: histogramInterval || "day",
                            format: "epoch_second",
                            order: {
                                _key: "asc"
                            }
                        },
                        aggs: {
                            to_events: {
                                nested: {
                                    path: "event"
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
                        }
                    }
                }
            }
        })).aggregations.daily_quality.buckets.map(q => ({
            date: q.key,
            quality: q.to_events.to_context.avg_confidenceSTT.value * 0.3 +
                q.to_events.to_context.conv.to_intents.avg_confidenceConv.value * 0.7
        }));

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};
const { elasticsearch } = require("../../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate } = req.query;

    try {
        const response = await elasticsearch.search({
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
        });

        res.status(200).json({
            name: "quality",
            value: ((
                response.aggregations.to_context.avg_confidenceSTT.value * 0.3 +
                response.aggregations.to_context.conv.to_intents.avg_confidenceConv
                .value *
                0.7
            ) * 100).toFixed(2)
        });
    } catch (error) {
        next(error);
    }
};
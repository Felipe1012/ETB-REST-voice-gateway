const { elasticsearch } = require("../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate, histogramInterval } = req.query;

    try {
        const response = (await elasticsearch.search({
            index: process.env.ES_CDR_INDEX || 'cdr',
            type: "_doc",
            body: {
                _source: ["event", "time"],
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
                    daily_latency: {
                        date_histogram: {
                            field: "created",
                            interval: histogramInterval || 'day',
                            format: "epoch_second",
                            min_doc_count: 1,
                        },
                        aggs: {
                            to_events: {
                                nested: {
                                    path: "event"
                                },
                                aggs: {
                                    avg_convTrans: {
                                        avg: {
                                            field: "event.maxConvTransaction"
                                        }
                                    },
                                    avg_TTStrans: {
                                        avg: {
                                            field: "event.maxTTSTransaction"
                                        }
                                    },
                                    avg_STTtrans: {
                                        avg: {
                                            field: "event.maxSTTTransaction"
                                        }
                                    }
                                }
                            }
                        }

                    }

                }
            }
        })).aggregations.daily_latency.buckets.map(r => ({
            date: r.key,
            avg_latency: r.to_events.avg_convTrans.value,
            avg_tts: r.to_events.avg_TTStrans.value,
            avg_stt: r.to_events.avg_STTtrans.value,
        }));

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};
const { elasticsearch } = require("../../../services");
const moment = require("moment");

module.exports = async(req, res, next) => {
    const { startDate, endDate, size } = req.query;
    try {
        const response = (await elasticsearch.search({
            index: process.env.ES_CDR_INDEX || 'cdr',
            type: "_doc",
            _source: ["event", "time"],
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
                    to_event: {
                        nested: {
                            path: "event"
                        },
                        aggs: {
                            to_conversations: {
                                nested: {
                                    path: "event.conversations"
                                },
                                aggs: {
                                    intents: {
                                        terms: {
                                            field: "event.conversations.allIntents",
                                            size: size || undefined
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })).aggregations.to_event.to_conversations.intents.buckets.map(i => ({
            intent_name: i.key
                .split("_")
                .join(" ")
                .toLowerCase(),
            count: i.doc_count
        }));

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};
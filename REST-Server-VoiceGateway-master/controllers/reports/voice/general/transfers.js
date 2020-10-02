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
                            totalCalls: {
                                value_count: {
                                    field: "event.transferTarget.keyword"
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({
            name: 'transfers',
            value: response.aggregations.kpis.totalCalls.value
        });
    } catch (error) {
        next(error);
    }
};
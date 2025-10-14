import { Order } from "../models/orders.model.js";
import { Report } from "../models/reports.model.js";
import { User } from "../models/users.model.js";

const _getReportByDate = async (date) => {
    const requestedDate = new Date(date);
    const startDate = new Date(requestedDate.setHours(0, 0, 0, 0));

    const report = await Report.findOne({ reportDate: startDate })
        .populate({
            path: 'bestSellingBooks.book',
            populate: { path: 'author' }
        });
    
    return report;
};

const generateDailySalesReport = async function () {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startingDate = new Date(yesterday.setHours(0, 0, 0, 0));
    const endDate = new Date(yesterday.setHours(23, 59, 59, 999));

    try {
        const [salesData, bestSellingBooks, newUserCount] = await Promise.all([
            Order.aggregate([
                { $match: { 
                    createdAt: { $gte: startingDate, $lte: endDate },
                    status: { $in: ["paid"] }
                }}, 
                { $group: {
                    _id: null, 
                    totalRevenue: { $sum: "$totalPrice" }, 
                    totalOrders: { $sum: 1 } 
                }},
            ]),
            Order.aggregate([
                { $match: { 
                    createdAt: { $gte: startingDate, $lte: endDate }, 
                    status: { $in: ["paid"] }
                }},
                { $unwind: "$books" },
                { $group: {
                    _id: "$books.book",
                    unitsSold: { $sum: "$books.quantity" }
                }},
                { $sort: { unitsSold: -1 } },
                {
                    $lookup: {
                        from: 'books', 
                        localField: '_id', 
                        foreignField: '_id', 
                        as: 'bookDetails' 
                    }
                },
                { $unwind: '$bookDetails' },
                { 
                    $project: { 
                        book: '$bookDetails',
                        unitsSold: 1, 
                        _id: 0 
                    } 
                }
            ]),
            User.countDocuments({
                createdAt: { $gte: startingDate, $lte: endDate }
            })
        ]);

        const reportData = {
            totalOrders: salesData[0]?.totalOrders || 0,
            totalRevenue: salesData[0]?.totalRevenue || 0,
            newUserCount: newUserCount || 0,
            bestSellingBooks: bestSellingBooks || [],
            reportDate: startingDate
        };

        if (reportData.totalOrders === 0) {
            return { status: "no_data_found", message: "No new data to report" };
        }

        const newReport = await Report.create(reportData);
        return newReport;

    } catch (error) {
        throw error;
    }
};
//by date
const DailyReport = async function(date) {
    return await _getReportByDate(date);
};

const getLastThirtyDailyReports = async function () {
    return Report.find().sort({ reportDate: -1 }).limit(30);
};

const getLatestReport = async function () {
    return Report.findOne().sort({ reportDate: -1 });
};

export default { generateDailySalesReport, DailyReport, getLastThirtyDailyReports,  getLatestReport};
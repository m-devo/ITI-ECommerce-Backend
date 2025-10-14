import reportService from "../../../services/report.service.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";

const retrieveDailyReports = catchAsync(async (req, res, next) => {
    const reports = await reportService.getLastThirtyDailyReports();
    
    if (!reports || reports.length === 0) {
        throw new ApiError(404, "No reports found for the last 30 days.");
    }

    res.status(200).json(
        new ApiResponse(200, { reports }, "Reports for the last 30 days retrieved successfully.")
    );
});

const retriveOneReportByDate = catchAsync(async (req, res, next) => {
    const { date } = req.params;
    const report = await reportService.DailyReport(date);

    if (!report) {
        throw new ApiError(404, `No report found for the date: ${date}`);
    }

    res.status(200).json(
        new ApiResponse(200, { report }, "Daily report retrieved successfully.")
    );
});

const retrieveLatestReport = catchAsync(async (req, res, next) => {
    const report = await reportService.getLatestReport();

    if (!report) {
        throw new ApiError(404, "No reports found.");
    }

    res.status(200).json(
        new ApiResponse(200, { report }, "Latest report retrieved successfully.")
    );
});

export default {
    geLastThirtyDailyReports: retrieveDailyReports, 
    DailyReport: retriveOneReportByDate,    
    getLatestReport: retrieveLatestReport
};
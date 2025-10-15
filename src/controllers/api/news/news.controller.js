import sendWeeklyNewsService from "../../../services/news.service.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";

const newsServiceController = catchAsync(async (req, res, next) => {
    await sendWeeklyNewsService();
    
    res.status(200).json(
        new ApiResponse(200, null, "Weekly news service has been triggered successfully.")
    );
});

export default newsServiceController;
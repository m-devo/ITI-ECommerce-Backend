import cartService from "../../../services/cart.service.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";

const cartController = catchAsync(async (req, res, next) => {
    await cartService.AbandonedCartReminder();

    res.status(200).json(
        new ApiResponse(200, null, "Abandoned cart reminder process was triggered successfully.")
    );
});

export default cartController;
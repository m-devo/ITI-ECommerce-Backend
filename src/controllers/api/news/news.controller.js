import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";
import { User } from "../../../models/users.model.js";
import ApiError from "../../../utils/ApiError.js";

export const subscribeToNewsletter = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "Email not found. Please register first.");
    }
    if (user.newsletterUnsubscribeCount >= 2) {
        throw new ApiError(403, "This account cannot re-subscribe to the newsletter.");
    }
    if (user.isSubscribedToNewsService) {
        throw new ApiError(400, "You are already subscribed.");
    }
    user.isSubscribedToNewsService = true;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, "Subscription successful!"));
});

export const unsubscribeFromNewsletter = catchAsync(async (req, res) => {
    const userId = req.currentUser.id; 

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    if (!user.isSubscribedToNewsService) {
        throw new ApiError(400, "You are not currently subscribed.");
    }
    user.isSubscribedToNewsService = false;
    user.newsletterUnsubscribeCount += 1; 
    await user.save();

    res.status(200).json(new ApiResponse(200, null, "You have been unsubscribed."));
});
import ApiError from '../utils/ApiError.js';

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: 'User not logged in'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

export default restrictTo;

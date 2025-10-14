import jwt from 'jsonwebtoken';
import {User} from '../models/users.model.js';
import ApiError from '../utils/ApiError.js';

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: 'User not found'
      });
    }

    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

export default protect;

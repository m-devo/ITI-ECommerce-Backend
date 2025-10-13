import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Access denied. No token provided.",
    });
  }

  try {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!currentUser) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid token",
      });
    }

    if (!currentUser.role || currentUser.role !== 'admin') {
      return res.status(403).json({
        status: "fail",
        message: "Access denied. Admins only.",
      });
    }

    req.currentUser = currentUser;
    next();
  } catch (err) {
    return res.status(403).json({
      status: "fail",
      message: "Invalid token",
    });
  }
};

export { verifyToken };

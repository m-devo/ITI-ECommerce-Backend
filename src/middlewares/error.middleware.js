const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.name === "ValidationError") {
    statusCode = 400;

    const errors = Object.values(err.errors).map((e) => {
      if (e.kind === "enum") {
        return `Invalid value for '${e.path}'. Allowed values: ${e.properties.enumValues.join(", ")}`;
      }
      return e.message;
    });

    message = errors.join(", ");
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format for field '${err.path}'.`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue);
    message = `Duplicate value for field(s): ${fields.join(", ")}`;
  }

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    stack:undefined
    //stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export default errorHandler;

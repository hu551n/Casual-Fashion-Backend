const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("أنت غير مسجل دخول! يرجى تسجيل الدخول للوصول.", 401),
      );
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(
          new AppError(
            "انتهت صلاحية التوكين، يرجى تسجيل الدخول مرة أخرى.",
            401,
          ),
        );
      }

      if (err.name === "JsonWebTokenError") {
        return next(
          new AppError("توكين غير صالح. يرجى تسجيل الدخول مرة أخرى.", 401),
        );
      }
      throw err;
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("المستخدم صاحب هذا التوكين لم يعد موجوداً.", 401),
      );
    }

    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("ليس لديك صلاحية للقيام بهذا الإجراء", 403));
    }
    next();
  };
};

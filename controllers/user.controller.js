const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.addAddress = catchAsync(async (req, res, next) => {
  const { title, addressString, isDefault } = req.body;
  const user = await User.findById(req.user._id);

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push({ title, addressString, isDefault });
  await user.save();

  res
    .status(200)
    .json({ status: "success", data: { user } });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { title, addressString, isDefault } = req.body;
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) return next(new AppError("العنوان غير موجود", 404));

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  if (title) address.title = title;
  if (addressString) address.addressString = addressString;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await user.save();
  res
    .status(200)
    .json({ status: "success", data: { user } });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== req.params.addressId,
  );
  await user.save();
  res
    .status(200)
    .json({ status: "success", data: { user } });
});

exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === req.params.addressId;
  });
  await user.save();
  res
    .status(200)
    .json({ status: "success", data: { user } });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("+active");
  res.status(200).json({ status: "success", results: users.length, data: { users } });
});

exports.toggleUserStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+active");
  if (!user) return next(new AppError("User not found", 404));

  if (user.role === "admin") {
    return next(new AppError("لا يمكنك حظر أو تعطيل حساب مسؤول آخر", 403));
  }

  user.active = req.body.active;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", data: { user } });
});

exports.getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.status(200).json({
    status: "success",
    data: {
      wishlist: user.wishlist,
    },
  });
});

exports.toggleWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  const index = user.wishlist.indexOf(productId);
  if (index === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message:
      index === -1
        ? "Product added to wishlist"
        : "Product removed from wishlist",
    data: {
      wishlist: user.wishlist,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("المستخدم غير موجود", 404));

  if (user.role === "admin" && req.user.id !== user.id) {
    return next(new AppError("لا يمكنك تعديل بيانات مسؤول آخر", 403));
  }

  const { name, email, mobile, gender, role } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (mobile) user.mobile = mobile;
  if (gender) user.gender = gender;
  if (role && req.user.role === "admin") user.role = role;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", data: { user } });
});

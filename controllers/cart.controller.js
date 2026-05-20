const mongoose = require("mongoose");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate(
    "items.productId",
  );

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  let changed = false;
  for (let item of cart.items) {
    if (item.productId.price !== item.price) {
      item.isPriceChanged = true;
      item.price = item.productId.price;
      changed = true;
    } else {
      item.isPriceChanged = false;
    }
  }

  if (changed) await cart.save();

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  if (req.user.role === "admin") {
    return next(
      new AppError(
        "الأدمن لا يمكنه الشراء من حسابه الإداري. يرجى استخدام حساب عميل.",
        403,
      ),
    );
  }
  const { slug } = req.params;
  const { quantity = 1, color, size } = req.body;

  const product = await Product.findOne({ slug });
  if (!product) return next(new AppError("المنتج غير موجود", 404));

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      items: [
        {
          productId: product._id,
          quantity,
          price: product.price,
          totalPrice: product.price * quantity,
          color,
          size,
        },
      ],
    });
  } else {
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === product._id.toString() &&
        item.color === color &&
        item.size === size,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice =
        cart.items[existingItemIndex].quantity * product.price;
    } else {
      cart.items.push({
        productId: product._id,
        quantity,
        price: product.price,
        totalPrice: product.price * quantity,
        color,
        size,
      });
    }
    await cart.save();
  }

  await cart.populate("items.productId");
  res.status(200).json({ status: "success", data: { cart } });
});

exports.syncCart = catchAsync(async (req, res, next) => {
  if (req.user.role === "admin") {
    return next(
      new AppError(
        "الأدمن لا يمكنه الشراء من حسابه الإداري. يرجى استخدام حساب عميل.",
        403,
      ),
    );
  }
  const { guestItems } = req.body;
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  for (const guestItem of guestItems) {
    const product = await Product.findOne({
      $or: [
        {
          _id: mongoose.isValidObjectId(guestItem.productId)
            ? guestItem.productId
            : null,
        },
        { slug: guestItem.slug },
      ],
    });
    if (product) {
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.productId.toString() === product._id.toString() &&
          item.color === guestItem.color &&
          item.size === guestItem.size,
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += guestItem.quantity;
        cart.items[itemIndex].totalPrice =
          cart.items[itemIndex].quantity * product.price;
      } else {
        cart.items.push({
          productId: product._id,
          quantity: guestItem.quantity,
          price: product.price,
          totalPrice: guestItem.quantity * product.price,
          color: guestItem.color,
          size: guestItem.size,
        });
      }
    }
  }

  await cart.save();
  await cart.populate("items.productId");
  res.status(200).json({ status: "success", data: { cart } });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId,
  );

  await cart.save();
  await cart.populate("items.productId");

  res.status(200).json({ status: "success", data: { cart } });
});

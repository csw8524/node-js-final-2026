const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");

const PW_ERR =
  "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (
      !isValidString(name) ||
      !isValidString(email) ||
      !isValidString(password)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (!isValidPassword(password)) {
      return next(appError(400, PW_ERR));
    }
    const userRepo = dataSource.getRepository("User");
    const existing = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });
    if (existing) {
      return next(appError(409, "Email 已被使用"));
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "USER",
    });
    res.status(201).json({
      status: "success",
      data: { user: { id: user.id, name: user.name } },
    });
  },

  async login(req, res, next) {
    const { email, password } = req.body;
    if (!isValidString(email) || !isValidString(password)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (!isValidPassword(password)) {
      return next(appError(400, PW_ERR));
    }
    const userRepo = dataSource.getRepository("User");
    const user = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });
    if (!user) {
      return next(appError(400, "使用者不存在或密碼輸入錯誤"));
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return next(appError(400, "使用者不存在或密碼輸入錯誤"));
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.get("secret.jwtSecret"),
      { expiresIn: config.get("secret.jwtExpiresDay") },
    );
    res.status(201).json({
      status: "success",
      data: { token, user: { name: user.name } },
    });
  },

  async getProfile(req, res, next) {
    res.json({
      status: "success",
      data: { user: { name: req.user.name, email: req.user.email } },
    });
  },

  async getCreditPackages(req, res, next) {
    const purchases = await dataSource.getRepository("CreditPurchase").find({
      where: { user_id: req.user.id },
      select: {
        name: true,
        purchased_credits: true,
        price_paid: true,
        purchase_at: true,
      },
      order: { purchase_at: "DESC" },
    });

    res.json({
      status: "success",
      data: purchases.map((purchase) => ({
        name: purchase.name,
        purchased_credits: purchase.purchased_credits,
        price_paid: purchase.price_paid,
        purchase_at: purchase.purchase_at,
      })),
    });
  },

  async getCourses(req, res, next) {
    const purchaseResult = await dataSource
      .getRepository("CreditPurchase")
      .createQueryBuilder("purchase")
      .select("COALESCE(SUM(purchase.purchased_credits), 0)", "total")
      .where("purchase.user_id = :userId", { userId: req.user.id })
      .getRawOne();

    const bookingResult = await dataSource
      .getRepository("CourseBooking")
      .createQueryBuilder("booking")
      .select("COUNT(booking.id)", "total")
      .where("booking.user_id = :userId", { userId: req.user.id })
      .andWhere("booking.cancelled_at IS NULL")
      .getRawOne();

    const totalCredits = Number(purchaseResult.total);
    const creditUsage = Number(bookingResult.total);

    const courseBooking = await dataSource
      .getRepository("CourseBooking")
      .createQueryBuilder("booking")
      .leftJoin("courses", "course", "course.id = booking.course_id")
      .leftJoin("users", "coach_user", "coach_user.id = course.user_id")
      .select("course.id", "course_id")
      .addSelect("course.name", "name")
      .addSelect("course.start_at", "start_at")
      .addSelect("course.end_at", "end_at")
      .addSelect("course.meeting_url", "meeting_url")
      .addSelect("coach_user.name", "coach_name")
      .addSelect("booking.cancelled_at", "cancelled_at")
      .where("booking.user_id = :userId", { userId: req.user.id })
      .orderBy("course.start_at", "ASC")
      .getRawMany();

    res.json({
      status: "success",
      data: {
        credit_remain: totalCredits - creditUsage,
        credit_usage: creditUsage,
        course_booking: courseBooking,
      },
    });
  },

  async putProfile(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (name.trim() === req.user.name) {
      return next(appError(400, "使用者名稱未變更"));
    }

    const userRepo = dataSource.getRepository("User");
    req.user.name = name.trim();
    const user = await userRepo.save(req.user);

    res.json({
      status: "success",
      data: { user: { name: user.name } },
    });
  },

  async putPassword(req, res, next) {
    const { password, new_password, confirm_new_password } = req.body;
    if (
      !isValidString(password) ||
      !isValidString(new_password) ||
      !isValidString(confirm_new_password)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (
      !isValidPassword(password) ||
      !isValidPassword(new_password) ||
      !isValidPassword(confirm_new_password)
    ) {
      return next(appError(400, PW_ERR));
    }
    if (password === new_password) {
      return next(appError(400, "新密碼不能與舊密碼相同"));
    }
    if (new_password !== confirm_new_password) {
      return next(appError(400, "新密碼與驗證新密碼不一致"));
    }

    const match = await bcrypt.compare(password, req.user.password);
    if (!match) {
      return next(appError(400, "密碼輸入錯誤"));
    }

    const userRepo = dataSource.getRepository("User");
    req.user.password = await bcrypt.hash(new_password, 10);
    await userRepo.save(req.user);

    res.json({
      status: "success",
      data: null,
    });
  },
};

module.exports = usersController;

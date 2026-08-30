const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const adminRevenueController = {
  async getRevenue(req, res, next) {
    const { month } = req.query;
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const year = new Date().getFullYear();
    const startAt = new Date(Date.UTC(year, monthIndex, 1));
    const endAt = new Date(Date.UTC(year, monthIndex + 1, 1));

    const packageSummary = await dataSource
      .getRepository("CreditPackage")
      .createQueryBuilder("credit_package")
      .select("COALESCE(SUM(credit_package.price), 0)", "total_price")
      .addSelect(
        "COALESCE(SUM(credit_package.credit_amount), 0)",
        "total_credits",
      )
      .getRawOne();

    const bookingSummary = await dataSource
      .getRepository("CourseBooking")
      .createQueryBuilder("booking")
      .leftJoin("courses", "course", "course.id = booking.course_id")
      .select("COUNT(booking.id)", "course_count")
      .addSelect("COUNT(DISTINCT booking.user_id)", "participants")
      .where("course.user_id = :userId", { userId: req.user.id })
      .andWhere("booking.cancelled_at IS NULL")
      .andWhere("booking.created_at >= :startAt", { startAt })
      .andWhere("booking.created_at < :endAt", { endAt })
      .getRawOne();

    const totalPrice = Number(packageSummary.total_price);
    const totalCredits = Number(packageSummary.total_credits);
    const courseCount = Number(bookingSummary.course_count);
    const participants = Number(bookingSummary.participants);
    const perCreditPrice = totalCredits === 0 ? 0 : totalPrice / totalCredits;
    const revenue = Math.floor(courseCount * perCreditPrice);

    res.json({
      status: "success",
      data: {
        total: {
          revenue,
          participants,
          course_count: courseCount,
        },
      },
    });
  },
};

module.exports = adminRevenueController;

const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

async function getCreditRemain(userId) {
  const purchaseResult = await dataSource
    .getRepository("CreditPurchase")
    .createQueryBuilder("purchase")
    .select("COALESCE(SUM(purchase.purchased_credits), 0)", "total")
    .where("purchase.user_id = :userId", { userId })
    .getRawOne();

  const bookingResult = await dataSource
    .getRepository("CourseBooking")
    .createQueryBuilder("booking")
    .select("COUNT(booking.id)", "total")
    .where("booking.user_id = :userId", { userId })
    .andWhere("booking.cancelled_at IS NULL")
    .getRawOne();

  return Number(purchaseResult.total) - Number(bookingResult.total);
}

async function getActiveBookingCount(courseId) {
  const result = await dataSource
    .getRepository("CourseBooking")
    .createQueryBuilder("booking")
    .select("COUNT(booking.id)", "total")
    .where("booking.course_id = :courseId", { courseId })
    .andWhere("booking.cancelled_at IS NULL")
    .getRawOne();

  return Number(result.total);
}

const coursesController = {
  async getCourses(req, res, next) {
    const courses = await dataSource
      .getRepository("Course")
      .createQueryBuilder("course")
      .leftJoin("users", "user", "user.id = course.user_id")
      .leftJoin("skills", "skill", "skill.id = course.skill_id")
      .select("course.id", "id")
      .addSelect("course.name", "name")
      .addSelect("course.description", "description")
      .addSelect("course.start_at", "start_at")
      .addSelect("course.end_at", "end_at")
      .addSelect("course.max_participants", "max_participants")
      .addSelect("user.name", "coach_name")
      .addSelect("skill.name", "skill_name")
      .where("course.start_at <= :now", { now: new Date() })
      .andWhere("course.end_at > :now", { now: new Date() })
      .orderBy("course.start_at", "ASC")
      .getRawMany();

    res.json({
      status: "success",
      data: courses,
    });
  },

  async bookCourse(req, res, next) {
    const { courseId } = req.params;
    const courseRepo = dataSource.getRepository("Course");
    const bookingRepo = dataSource.getRepository("CourseBooking");

    const course = await courseRepo.findOneBy({ id: courseId });
    if (!course) {
      return next(appError(400, "ID錯誤"));
    }

    const existingBooking = await bookingRepo.findOneBy({
      user_id: req.user.id,
      course_id: courseId,
    });
    if (existingBooking) {
      return next(appError(400, "已經報名過此課程"));
    }

    const creditRemain = await getCreditRemain(req.user.id);
    if (creditRemain <= 0) {
      return next(appError(400, "已無可使用堂數"));
    }

    const activeBookingCount = await getActiveBookingCount(courseId);
    if (activeBookingCount >= course.max_participants) {
      return next(appError(400, "已達最大參加人數，無法參加"));
    }

    await bookingRepo.save({
      user_id: req.user.id,
      course_id: courseId,
    });

    res.status(201).json({
      status: "success",
      data: null,
    });
  },

  async cancelBooking(req, res, next) {
    const { courseId } = req.params;
    const bookingRepo = dataSource.getRepository("CourseBooking");
    const booking = await bookingRepo
      .createQueryBuilder("booking")
      .where("booking.user_id = :userId", { userId: req.user.id })
      .andWhere("booking.course_id = :courseId", { courseId })
      .andWhere("booking.cancelled_at IS NULL")
      .getOne();

    if (!booking) {
      return next(appError(400, "ID錯誤"));
    }

    booking.cancelled_at = new Date();
    await bookingRepo.save(booking);

    res.json({
      status: "success",
      data: null,
    });
  },
};

module.exports = coursesController;

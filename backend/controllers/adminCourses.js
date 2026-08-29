const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const isHttpsUrl = (value) =>
  typeof value === "string" && value.trim().startsWith("https");

const getCourseStatus = (course) => {
  const now = new Date();
  if (new Date(course.start_at) > now) return "尚未開始";
  if (new Date(course.end_at) <= now) return "已結束";
  return "進行中";
};

const isValidCourseBody = (body) =>
  isValidString(body.skill_id) &&
  isValidString(body.name) &&
  isValidString(body.description) &&
  isValidString(body.start_at) &&
  isValidString(body.end_at) &&
  isInteger(body.max_participants) &&
  body.max_participants >= 0 &&
  isHttpsUrl(body.meeting_url);

async function getCurrentCoach(userId) {
  return dataSource.getRepository("Coach").findOneBy({ user_id: userId });
}

const adminCoursesController = {
  async getAll(req, res, next) {
    const courses = await dataSource
      .getRepository("Course")
      .createQueryBuilder("course")
      .leftJoin(
        "course_bookings",
        "booking",
        "booking.course_id = course.id AND booking.cancelled_at IS NULL",
      )
      .select("course.id", "id")
      .addSelect("course.name", "name")
      .addSelect("course.start_at", "start_at")
      .addSelect("course.end_at", "end_at")
      .addSelect("course.max_participants", "max_participants")
      .addSelect("course.meeting_url", "meeting_url")
      .addSelect("COUNT(booking.id)", "participants")
      .where("course.user_id = :userId", { userId: req.user.id })
      .groupBy("course.id")
      .addGroupBy("course.name")
      .addGroupBy("course.start_at")
      .addGroupBy("course.end_at")
      .addGroupBy("course.max_participants")
      .addGroupBy("course.meeting_url")
      .orderBy("course.start_at", "ASC")
      .getRawMany();

    res.json({
      status: "success",
      data: courses.map((course) => ({
        id: course.id,
        name: course.name,
        status: getCourseStatus(course),
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        meeting_url: course.meeting_url,
        participants: Number(course.participants),
      })),
    });
  },

  async create(req, res, next) {
    if (!isValidCourseBody(req.body)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coach = await getCurrentCoach(req.user.id);
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    const skill = await dataSource
      .getRepository("Skill")
      .findOneBy({ id: req.body.skill_id });
    if (!skill) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const course = await dataSource.getRepository("Course").save({
      user_id: req.user.id,
      coach_id: coach.id,
      skill_id: req.body.skill_id,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      start_at: req.body.start_at,
      end_at: req.body.end_at,
      max_participants: req.body.max_participants,
      meeting_url: req.body.meeting_url.trim(),
    });

    res.status(201).json({
      status: "success",
      data: { course },
    });
  },

  async getOne(req, res, next) {
    const { courseId } = req.params;
    const course = await dataSource
      .getRepository("Course")
      .createQueryBuilder("course")
      .leftJoin("skills", "skill", "skill.id = course.skill_id")
      .select("course.id", "id")
      .addSelect("course.name", "name")
      .addSelect("course.description", "description")
      .addSelect("course.start_at", "start_at")
      .addSelect("course.end_at", "end_at")
      .addSelect("course.max_participants", "max_participants")
      .addSelect("skill.name", "skill_name")
      .addSelect("course.skill_id", "skill_id")
      .addSelect("course.meeting_url", "meeting_url")
      .where("course.id = :courseId", { courseId })
      .andWhere("course.user_id = :userId", { userId: req.user.id })
      .getRawOne();

    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    res.json({
      status: "success",
      data: course,
    });
  },

  async update(req, res, next) {
    if (!isValidCourseBody(req.body)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const { courseId } = req.params;
    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOneBy({
      id: courseId,
      user_id: req.user.id,
    });
    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    const skill = await dataSource
      .getRepository("Skill")
      .findOneBy({ id: req.body.skill_id });
    if (!skill) {
      return next(appError(400, "欄位未填寫正確"));
    }

    course.skill_id = req.body.skill_id;
    course.name = req.body.name.trim();
    course.description = req.body.description.trim();
    course.start_at = req.body.start_at;
    course.end_at = req.body.end_at;
    course.max_participants = req.body.max_participants;
    course.meeting_url = req.body.meeting_url.trim();

    const savedCourse = await courseRepo.save(course);

    res.json({
      status: "success",
      data: { course: savedCourse },
    });
  },
};

module.exports = adminCoursesController;

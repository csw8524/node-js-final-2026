const { dataSource } = require("../db/data-source");

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
};

module.exports = coursesController;

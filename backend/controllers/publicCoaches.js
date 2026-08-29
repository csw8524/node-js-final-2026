const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

const isPositiveIntegerString = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0;
};

const publicCoachesController = {
  async getCoaches(req, res, next) {
    const { per, page } = req.query;
    if (!isPositiveIntegerString(per) || !isPositiveIntegerString(page)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const take = Number(per);
    const skip = (Number(page) - 1) * take;

    const coaches = await dataSource
      .getRepository("Coach")
      .createQueryBuilder("coach")
      .leftJoin("users", "user", "user.id = coach.user_id")
      .select("coach.id", "id")
      .addSelect("coach.user_id", "user_id")
      .addSelect("user.name", "name")
      .orderBy("coach.created_at", "ASC")
      .offset(skip)
      .limit(take)
      .getRawMany();

    res.json({
      status: "success",
      data: coaches,
    });
  },

  async getCoachDetail(req, res, next) {
    const { coachId } = req.params;

    const coach = await dataSource
      .getRepository("Coach")
      .createQueryBuilder("coach")
      .leftJoin("users", "user", "user.id = coach.user_id")
      .select("coach.id", "id")
      .addSelect("coach.user_id", "user_id")
      .addSelect("coach.experience_years", "experience_years")
      .addSelect("coach.description", "description")
      .addSelect("coach.profile_image_url", "profile_image_url")
      .addSelect("coach.created_at", "created_at")
      .addSelect("coach.updated_at", "updated_at")
      .addSelect("user.name", "user_name")
      .addSelect("user.role", "user_role")
      .where("coach.id = :coachId", { coachId })
      .getRawOne();

    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

    const skills = await dataSource
      .getRepository("CoachLinkSkill")
      .createQueryBuilder("coach_link_skill")
      .leftJoin("skills", "skill", "skill.id = coach_link_skill.skill_id")
      .select("skill.name", "name")
      .where("coach_link_skill.coach_id = :coachId", { coachId })
      .orderBy("coach_link_skill.created_at", "ASC")
      .getRawMany();

    res.json({
      status: "success",
      data: {
        user: {
          name: coach.user_name,
          role: coach.user_role,
        },
        coach: {
          id: coach.id,
          user_id: coach.user_id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          created_at: coach.created_at,
          updated_at: coach.updated_at,
          skills: skills.map((skill) => skill.name),
        },
      },
    });
  },

  async getCoachCourses(req, res, next) {
    const { coachId } = req.params;

    const coach = await dataSource.getRepository("Coach").findOneBy({
      id: coachId,
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

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
      .where("course.coach_id = :coachId", { coachId })
      .andWhere("course.end_at > :now", { now: new Date() })
      .orderBy("course.start_at", "ASC")
      .getRawMany();

    res.json({
      status: "success",
      data: courses,
    });
  },
};

module.exports = publicCoachesController;

const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const isHttpsUrl = (value) =>
  typeof value === "string" && value.trim().startsWith("https");

const adminCoachesController = {
  async promoteUserToCoach(req, res, next) {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;

    if (
      !isInteger(experience_years) ||
      experience_years < 0 ||
      !isValidString(description) ||
      (profile_image_url !== undefined &&
        profile_image_url !== "" &&
        !isHttpsUrl(profile_image_url))
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const userRepo = dataSource.getRepository("User");
    const coachRepo = dataSource.getRepository("Coach");

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      return next(appError(400, "使用者不存在"));
    }

    const existingCoach = await coachRepo.findOneBy({ user_id: userId });
    if (existingCoach) {
      return next(appError(409, "使用者已經是教練"));
    }

    user.role = "COACH";
    await userRepo.save(user);

    const coach = await coachRepo.save({
      user_id: user.id,
      experience_years,
      description: description.trim(),
      profile_image_url: isValidString(profile_image_url)
        ? profile_image_url.trim()
        : null,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          name: user.name,
          role: user.role,
        },
        coach,
      },
    });
  },

  async getCoach(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
    const links = await coachLinkSkillRepo.find({
      where: { coach_id: coach.id },
      select: { skill_id: true },
      order: { created_at: "ASC" },
    });

    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url,
        skill_ids: links.map((link) => link.skill_id),
      },
    });
  },

  async putCoach(req, res, next) {
    const { experience_years, description, profile_image_url, skill_ids } =
      req.body;

    if (
      !isInteger(experience_years) ||
      experience_years < 0 ||
      !isValidString(description) ||
      !isHttpsUrl(profile_image_url) ||
      !Array.isArray(skill_ids) ||
      skill_ids.length === 0 ||
      skill_ids.some((skillId) => !isValidString(skillId))
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    const skillRepo = dataSource.getRepository("Skill");
    const skills = await skillRepo
      .createQueryBuilder("skill")
      .where("skill.id IN (:...skillIds)", { skillIds: skill_ids })
      .getMany();
    if (skills.length !== skill_ids.length) {
      return next(appError(400, "欄位未填寫正確"));
    }

    coach.experience_years = experience_years;
    coach.description = description.trim();
    coach.profile_image_url = profile_image_url.trim();
    await coachRepo.save(coach);

    const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
    await coachLinkSkillRepo.delete({ coach_id: coach.id });
    await coachLinkSkillRepo.save(
      skill_ids.map((skillId) => ({
        coach_id: coach.id,
        skill_id: skillId,
      })),
    );

    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url,
        skill_ids,
      },
    });
  },
};

module.exports = adminCoachesController;

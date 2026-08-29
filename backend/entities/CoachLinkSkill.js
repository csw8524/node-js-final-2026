const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CoachLinkSkill",
  tableName: "coach_link_skills",
  columns: {
    coach_id: { type: "uuid", primary: true },
    skill_id: { type: "uuid", primary: true },
    created_at: { type: "timestamp", createDate: true },
  },
  relations: {
    coach: {
      type: "many-to-one",
      target: "Coach",
      joinColumn: { name: "coach_id" },
      onDelete: "CASCADE",
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: { name: "skill_id" },
      onDelete: "CASCADE",
    },
  },
});

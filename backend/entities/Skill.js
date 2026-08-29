const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Skill",
  tableName: "skills",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    name: { type: "varchar", length: 50, nullable: false, unique: true },
    created_at: { type: "timestamp", createDate: true },
  },
  relations: {
    coach_link_skills: {
      type: "one-to-many",
      target: "CoachLinkSkill",
      inverseSide: "skill",
    },
    courses: {
      type: "one-to-many",
      target: "Course",
      inverseSide: "skill",
    },
  },
});

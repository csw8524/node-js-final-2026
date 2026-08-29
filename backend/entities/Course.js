const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Course",
  tableName: "courses",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    user_id: { type: "uuid", nullable: false },
    coach_id: { type: "uuid", nullable: false },
    skill_id: { type: "uuid", nullable: false },
    name: { type: "varchar", length: 100, nullable: false },
    description: { type: "text", nullable: false },
    start_at: { type: "timestamp", nullable: false },
    end_at: { type: "timestamp", nullable: false },
    max_participants: { type: "integer", nullable: false },
    meeting_url: { type: "varchar", length: 2048, nullable: false },
    created_at: { type: "timestamp", createDate: true },
    updated_at: { type: "timestamp", updateDate: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
    },
    coach: {
      type: "many-to-one",
      target: "Coach",
      joinColumn: { name: "coach_id" },
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: { name: "skill_id" },
    },
    course_bookings: {
      type: "one-to-many",
      target: "CourseBooking",
      inverseSide: "course",
    },
  },
});

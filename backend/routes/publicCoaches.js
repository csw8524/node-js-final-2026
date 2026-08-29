const router = require("express").Router();
const publicCoachesController = require("../controllers/publicCoaches");

router.get("/", publicCoachesController.getCoaches);
router.get("/:coachId/courses", publicCoachesController.getCoachCourses);
router.get("/:coachId", publicCoachesController.getCoachDetail);

module.exports = router;

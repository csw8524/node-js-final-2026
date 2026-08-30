const router = require("express").Router();
const coursesController = require("../controllers/courses");
const isAuth = require("../middlewares/isAuth");

router.get("/", coursesController.getCourses);
router.post("/:courseId", isAuth, coursesController.bookCourse);
router.delete("/:courseId", isAuth, coursesController.cancelBooking);

module.exports = router;

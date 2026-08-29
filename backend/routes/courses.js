const router = require("express").Router();
const coursesController = require("../controllers/courses");

router.get("/", coursesController.getCourses);

module.exports = router;

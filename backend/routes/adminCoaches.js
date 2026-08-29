const router = require("express").Router();
const adminCoachesController = require("../controllers/adminCoaches");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.post("/:userId", adminCoachesController.promoteUserToCoach);
router.get("/", isAuth, isCoach, adminCoachesController.getCoach);
router.put("/", isAuth, isCoach, adminCoachesController.putCoach);

module.exports = router;

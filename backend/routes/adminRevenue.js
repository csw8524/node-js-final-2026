const router = require("express").Router();
const adminRevenueController = require("../controllers/adminRevenue");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.get("/", isAuth, isCoach, adminRevenueController.getRevenue);

module.exports = router;

const router = require("express").Router();
const usersController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");

router.post("/signup", usersController.signup);
router.post("/login", usersController.login);
router.get("/profile", isAuth, usersController.getProfile);
router.put("/profile", isAuth, usersController.putProfile);
router.put("/password", isAuth, usersController.putPassword);
router.get("/credit-package", isAuth, usersController.getCreditPackages);
router.get("/courses", isAuth, usersController.getCourses);

module.exports = router;

const router = require("express").Router();
const creditPackageController = require("../controllers/creditPackage");
const isAuth = require("../middlewares/isAuth");

router.get("/", creditPackageController.getCreditPackages);
router.post("/", creditPackageController.postCreditPackage);
router.post("/:creditPackageId", isAuth, creditPackageController.buyCreditPackage);
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackage);

module.exports = router;

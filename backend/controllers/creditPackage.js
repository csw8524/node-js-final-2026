const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const creditPackageController = {
  async getCreditPackages(req, res, next) {
    const creditPackages = await dataSource
      .getRepository("CreditPackage")
      .find({
        select: { id: true, name: true, credit_amount: true, price: true },
        order: { created_at: "ASC" },
      });
    res.json({ status: "success", data: creditPackages });
    return;
  },

  async postCreditPackage(req, res, next) {
    const { name, credit_amount, price } = req.body;
    if (
      !isValidString(name) ||
      !isInteger(credit_amount) ||
      !isInteger(price) ||
      credit_amount < 0 ||
      price < 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const existing = await creditPackageRepo.findOneBy({ name: name.trim() });
    if (existing) {
      return next(appError(409, "資料重複"));
    }

    const creditPackage = await creditPackageRepo.save({
      name: name.trim(),
      credit_amount,
      price,
    });
    res.json({ status: "success", data: creditPackage });
  },

  async buyCreditPackage(req, res, next) {
    const { creditPackageId } = req.params;
    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const creditPackage = await creditPackageRepo.findOneBy({
      id: creditPackageId,
    });

    if (!creditPackage) {
      return next(appError(400, "ID錯誤"));
    }

    await dataSource.getRepository("CreditPurchase").save({
      user_id: req.user.id,
      credit_package_id: creditPackage.id,
      name: creditPackage.name,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price,
    });

    res.json({ status: "success", data: null });
  },

  async deleteCreditPackage(req, res, next) {
    try {
      const { creditPackageId } = req.params;
      const result = await dataSource
        .getRepository("CreditPackage")
        .delete(creditPackageId);
      if (result.affected === 0) {
        next(appError(400, "ID錯誤"));
        return;
      }
      res.json({ status: "success" });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
};

module.exports = creditPackageController;

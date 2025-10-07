"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_1 = require("../controllers/category");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', category_1.getCategories);
router.get('/popular', category_1.getPopularCategories);
router.get('/:id', category_1.getCategoryById);
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, category_1.createCategoryValidation, category_1.createCategory);
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, category_1.createCategoryValidation, category_1.updateCategory);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, category_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.js.map
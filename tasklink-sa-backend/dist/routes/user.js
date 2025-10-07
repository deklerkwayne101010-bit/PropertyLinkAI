"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/profile', user_1.getUserProfile);
router.put('/profile', user_1.updateProfileValidation, user_1.updateProfile);
router.put('/profile/worker', auth_1.requireDoer, user_1.updateWorkerProfileValidation, user_1.updateWorkerProfile);
router.put('/profile/client', auth_1.requirePoster, user_1.updateClientProfileValidation, user_1.updateClientProfile);
router.get('/:userId', user_1.getUserById);
router.delete('/account', user_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=user.js.map
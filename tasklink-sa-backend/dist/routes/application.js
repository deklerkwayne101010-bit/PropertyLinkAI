"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const application_1 = require("../controllers/application");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/', auth_1.requireDoer, application_1.createApplicationValidation, application_1.applyForJob);
router.get('/job/:jobId', auth_1.requirePoster, application_1.getJobApplications);
router.get('/my', auth_1.requireDoer, application_1.getUserApplications);
router.get('/:id', application_1.getApplicationById);
router.put('/:id', auth_1.requirePoster, application_1.updateApplicationValidation, application_1.updateApplicationStatus);
router.delete('/:id', auth_1.requireDoer, application_1.withdrawApplication);
exports.default = router;
//# sourceMappingURL=application.js.map
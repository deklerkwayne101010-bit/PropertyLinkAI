"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_1 = require("../controllers/job");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/', auth_1.requirePoster, job_1.createJobValidation, job_1.createJob);
router.get('/', job_1.searchValidation, job_1.getJobs);
router.get('/nearby', job_1.getNearbyJobs);
router.get('/search', job_1.searchValidation, job_1.searchJobs);
router.get('/:id', job_1.getJobById);
router.put('/:id', auth_1.requirePoster, job_1.updateJobValidation, job_1.updateJob);
router.delete('/:id', auth_1.requirePoster, job_1.deleteJob);
router.post('/:id/featured', auth_1.requirePoster, job_1.makeJobFeatured);
exports.default = router;
//# sourceMappingURL=job.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const message_1 = require("../controllers/message");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/:jobId/history', auth_1.requireJobAccess, message_1.getChatHistory);
router.post('/:jobId', auth_1.requireJobAccess, message_1.sendMessage);
router.get('/:jobId/unread', auth_1.requireJobAccess, message_1.getUnreadCount);
router.put('/:jobId/read', auth_1.requireJobAccess, message_1.markMessagesAsRead);
router.delete('/:messageId', message_1.deleteMessage);
router.get('/rooms', message_1.getChatRooms);
router.get('/:jobId/search', auth_1.requireJobAccess, message_1.searchMessages);
exports.default = router;
//# sourceMappingURL=message.js.map

const express = require('express');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { UserConversation, Message } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

const rules = {
	addMessage: {
		conversationId: ['required', 'number'],
		content: 'required'
	}
};

router.post('/', isLoggedIn, validate(rules.addMessage), (req, res) => {
	const chat = app.get('chat');
	const { conversationId, content } = req.body;

	UserConversation.findOne({
		where: {
			conversationId,
			userId: req.user.id
		}
	}).then((record) => {
		if (!record) {
			return sendApiError(res, 'Invalid conversation id');
		}

		return Message.create({
			conversationId,
			content,
			userId: req.user.id
		});
	}).then((messageRecord) => {
		chat.sendMessage(conversationId, messageRecord.toJSON());
		//TODO: think of a way to check if the message/conversation has unread messages for each user (maybe add unread flag in the user-conversation table)
		sendResponse(res, messageRecord);
	}).catch((err) => {
		sendApiError(res, err);
	});
});

module.exports = router;

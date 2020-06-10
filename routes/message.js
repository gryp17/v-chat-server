
const sequelize = require('sequelize');
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
	}).then((userConversationRecord) => {
		if (!userConversationRecord) {
			return sendApiError(res, 'Invalid conversation id');
		}

		return Message.create({
			conversationId,
			content,
			userId: req.user.id
		}).then((messageRecord) => {
			//mark the conversation as unread for all users except the message author
			return UserConversation.update({
				unread: true
			}, {
				where: {
					conversationId,
					userId: {
						[sequelize.Op.not]: req.user.id
					}
				}
			}).then(() => {
				return messageRecord;
			});
		});
	}).then((messageRecord) => {
		chat.sendMessage(conversationId, messageRecord.toJSON());
		sendResponse(res, messageRecord);
	}).catch((err) => {
		sendApiError(res, err);
	});
});

module.exports = router;

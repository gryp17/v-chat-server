
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
	},
	getMessages: {
		conversationId: ['required', 'number'],
		limit: ['required', 'number'],
		offset: ['required', 'number']
	}
};

router.post('/', isLoggedIn, validate(rules.addMessage), async (req, res) => {
	const chat = app.get('chat');
	const { conversationId, content } = req.body;

	try {
		const userConversationRecord = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.user.id
			}
		});

		if (!userConversationRecord) {
			throw new Error('Invalid conversation id');
		}

		const messageRecord = await Message.create({
			conversationId,
			content,
			userId: req.user.id
		});

		await UserConversation.update({
			unread: true
		}, {
			where: {
				conversationId,
				userId: {
					[sequelize.Op.not]: req.user.id
				}
			}
		});

		chat.sendMessage(conversationId, messageRecord.toJSON());
		sendResponse(res, messageRecord.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

router.get('/', isLoggedIn, validate(rules.getMessages), async (req, res) => {
	const { conversationId, limit, offset } = req.query;

	try {
		const userConversationRecord = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.user.id
			}
		});

		if (!userConversationRecord) {
			throw new Error('Invalid conversation id');
		}

		const messages = await Message.findAll({
			raw: true,
			where: {
				conversationId
			},
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [
				['createdAt', 'desc']
			]
		});

		sendResponse(res, messages);
	} catch (err) {
		sendApiError(res, err);
	}
});

module.exports = router;

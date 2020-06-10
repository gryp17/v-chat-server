
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { Conversation, User, UserConversation, Message } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

router.get('/all', isLoggedIn, (req, res) => {
	const unreadState = {};

	UserConversation.findAll({
		raw: true,
		where: {
			userId: req.user.id
		}
	}).map((userConversation) => {
		unreadState[userConversation.conversationId] = Boolean(userConversation.unread);
		return userConversation.conversationId;
	}).then((conversationIds) => {
		return Conversation.findAll({
			where: {
				id: conversationIds
			},
			include: [
				{
					model: User,
					attributes: [
						'id'
					]
				},
				{
					model: Message,
					limit: 5,
					order: [
						['createdAt', 'desc']
					]
				}
			]
		});
	}).filter((conversation) => {
		//return only conversations that have messages
		return conversation.messages && conversation.messages.length > 0;
	}).map((conversation) => {
		//flatten the users array
		const item = conversation.toJSON();

		item.users = item.users.map((user) => {
			return user.id;
		});

		//set the unread property
		item.unread = unreadState[item.id];

		return item;
	}).then((conversations) => {
		sendResponse(res, conversations);
	}).catch((err) => {
		sendApiError(res, err);
	});
});

router.post('/markAsRead', isLoggedIn, (req, res) => {
	const { conversationId } = req.body;

	UserConversation.findOne({
		where: {
			conversationId,
			userId: req.user.id
		}
	}).then((record) => {
		if (!record) {
			return sendApiError(res, 'Invalid conversation id');
		}

		record.update({
			unread: false
		}).then((updated) => {
			sendResponse(res, updated.toJSON());
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

module.exports = router;

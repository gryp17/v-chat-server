
const express = require('express');
const app = require('../app');
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
			throw new Error('Invalid conversation id');
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

//create conversation
router.post('/', isLoggedIn, (req, res) => {
	const chat = app.get('chat');

	const { userId } = req.body;

	User.findByPk(userId).then((userInstance) => {
		if (!userInstance) {
			throw new Error('Invalid user id');
		}
	}).then(() => {
		return conversationExists(req.user.id, userId);
	}).then((conversationExists) => {
		if (conversationExists) {
			throw new Error('Duplicate conversation');
		}

		Conversation.create({
			isPrivate: true,
			createdBy: req.user.id
		}).then((conversationInstance) => {
			const tasks = [req.user.id, userId].map((id) => {
				const user = User.build({
					id
				});

				return conversationInstance.addUser(user);
			});

			Promise.all(tasks).then(() => {
				const conversation = conversationInstance.toJSON();
				conversation.unread = false;
				conversation.users = [req.user.id, userId];
				conversation.messages = [];

				//send the new conversation via socket.io to both users
				chat.newConversation(conversation, [req.user.id, userId]);

				sendResponse(res, conversation);
			});
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

function conversationExists(currentUserId, userId) {
	return User.findByPk(currentUserId, {
		include: [
			{
				model: Conversation,
				include: [
					{
						model: User,
						attributes: [
							'id'
						]
					}
				]
			}
		]
	}).then((userInstance) => {
		const conversation = userInstance.conversations.find((conversation) => {
			return conversation.isPrivate && conversation.users.find((user) => user.id === userId);
		});

		if (conversation) {
			return true;
		}

		return false;
	});
}

module.exports = router;

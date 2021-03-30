
const express = require('express');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { Conversation, User, UserConversation, Message, File } = require('../models');
const { sendResponse, sendApiError } = require('../utils');
const { errorCodes } = require('../config');

const router = express.Router();

router.get('/all', isLoggedIn, async (req, res) => {
	const unreadState = {};

	try {
		const conversationIds = await UserConversation.findAll({
			raw: true,
			where: {
				userId: req.session.user.id
			}
		}).map((userConversation) => {
			unreadState[userConversation.conversationId] = Boolean(userConversation.unread);
			return userConversation.conversationId;
		});

		const conversations = await Conversation.findAll({
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
					limit: 10,
					order: [
						['createdAt', 'desc']
					],
					include: [
						{
							model: File
						}
					]
				}
			]
		}).map((conversation) => {
			//flatten the users array
			const item = conversation.toJSON();

			item.users = item.users.map((user) => {
				return user.id;
			});

			//set the unread property
			item.unread = unreadState[item.id];

			return item;
		});

		sendResponse(res, conversations);
	} catch (err) {
		sendApiError(res, err);
	}
});

router.post('/markAsRead', isLoggedIn, async (req, res) => {
	const { conversationId } = req.body;

	try {
		const record = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.session.user.id
			}
		});

		if (!record) {
			throw new Error(errorCodes.INVALID_CONVERSATION_ID);
		}

		const updated = await record.update({
			unread: false
		});

		sendResponse(res, updated.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

//create conversation
router.post('/', isLoggedIn, async (req, res) => {
	const chat = app.get('chat');

	const { userId } = req.body;
	const conversationUsers = [req.session.user.id, userId];

	try {
		const userInstance = await User.findByPk(userId);

		if (!userInstance) {
			throw new Error(errorCodes.INVALID_USER_ID);
		}

		const exists = await conversationExists(req.session.user.id, userId);

		if (exists) {
			throw new Error(errorCodes.DUPLICATE_CONVERSATION);
		}

		const conversationInstance = await Conversation.create({
			isPrivate: true,
			createdBy: req.session.user.id
		});

		//add both users to the conversation
		const tasks = conversationUsers.map((id) => {
			const user = User.build({
				id
			});

			return conversationInstance.addUser(user);
		});

		await Promise.all(tasks);

		const conversation = conversationInstance.toJSON();
		conversation.unread = false;
		conversation.users = conversationUsers;
		conversation.messages = [];

		//send the new conversation via socket.io to both users
		chat.newConversation(conversation, conversationUsers);

		sendResponse(res, conversation);
	} catch (err) {
		sendApiError(res, err);
	}
});

async function conversationExists(currentUserId, userId) {
	const userInstance = await User.findByPk(currentUserId, {
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
	});

	const conversation = userInstance.conversations.find((conversation) => {
		return conversation.isPrivate && conversation.users.find((user) => user.id === userId);
	});

	return !!conversation;
}

module.exports = router;

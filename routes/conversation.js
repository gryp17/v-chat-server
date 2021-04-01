
const express = require('express');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { Conversation, User, UserConversation, Message, File } = require('../models');
const { sendResponse, sendApiError } = require('../utils');
const { errorCodes } = require('../config');

const router = express.Router();

const rules = {
	createConversation: {
		userId: ['required', 'integer']
	}
};

router.get('/all', isLoggedIn, async (req, res) => {
	try {
		// fetch the user conversations with all the necessary associations
		const userRecord = await User.findByPk(req.session.user.id, {
			include: [
				{
					model: Conversation,
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
				}
			]
		});

		const conversations = userRecord.conversations.map((conversation) => {
			//flatten the users array
			const item = conversation.toJSON();

			item.users = item.users.map((user) => {
				return user.id;
			});

			//set the unread and muted properties
			item.unread = item.user_conversation.unread;
			item.muted = item.user_conversation.muted;

			//remove the unnecesary data
			delete item.user_conversation;

			return item;
		});

		sendResponse(res, conversations);
	} catch (err) {
		sendApiError(res, err);
	}
});

router.post('/:id/read', isLoggedIn, async (req, res) => {
	const conversationId = req.params.id;

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
router.post('/', isLoggedIn, validate(rules.createConversation), async (req, res) => {
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

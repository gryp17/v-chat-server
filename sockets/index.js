const _ = require('lodash');
const createSocket = require('socket.io');
const { sockedIsLoggedIn } = require('../middleware/authentication');
const { UserConversation, Conversation, User, Message } = require('../models');
const { sendSocketError } = require('../utils');

module.exports = (server) => {
	const chat = createSocket(server);

	//checks if the socket.io requests are authorized
	chat.use(sockedIsLoggedIn);

	chat.on('connection', (socket) => {
		//update the online users list for everybody
		chat.emit('updateOnlineUsers', chat.getConnectedUsers());

		chat.getUserConversations(socket.user.id).then((conversations) => {
			socket.emit('updateConversations', conversations);
		});

		//disconnect event handler
		socket.on('disconnect', () => {
			chat.emit('updateOnlineUsers', chat.getConnectedUsers());
		});
	});

	chat.updateConversationUsers = (conversationId) => {
		Conversation.findByPk(conversationId, {
			include: [
				{
					model: User,
					attributes: {
						exclude: [
							'password'
						]
					}
				}
			]
		}).then((conversation) => {
			const users = conversation.toJSON().users;
			chat.emit('updateConversationUsers', {
				conversationId,
				users
			});
		}).catch((err) => {
			sendSocketError(chat, err);
		});
	};

	/**
	 * Helper function that returns an array of all connected users
	 * @returns {Array}
	 */
	chat.getConnectedUsers = () => {
		const users = [];

		_.forOwn(chat.sockets.connected, (data, socketId) => {
			//set the socketId parameter
			data.user.socketId = socketId;
			users.push(data.user);
		});

		return users;
	};

	chat.getUserConversations = (userId) => {
		return UserConversation.findAll({
			where: {
				userId
			},
			raw: true
		}).map((userConversation) => {
			return userConversation.conversationId;
		}).then((conversationIds) => {
			return Conversation.findAll({
				where: {
					id: conversationIds
				},
				include: [
					{
						model: User,
						attributes: {
							exclude: [
								'password'
							]
						}
					},
					{
						model: Message,
						limit: 5
					}
				]
			});
		}).catch((err) => {
			sendSocketError(chat, err);
		});
	};

	return chat;
};

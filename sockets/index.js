const _ = require('lodash');
const createSocket = require('socket.io');
const { sockedIsLoggedIn } = require('../middleware/authentication');
const { UserConversation, Conversation, User } = require('../models');
const { sendSocketError } = require('../utils');

module.exports = (server) => {
	const chat = createSocket(server);

	//checks if the socket.io requests are authorized
	chat.use(sockedIsLoggedIn);

	chat.on('connection', (socket) => {
		//update the online users list for everybody
		chat.updateOnlineUsers();

		//disconnect event handler
		socket.on('disconnect', () => {
			chat.updateOnlineUsers();
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

	chat.updateOnlineUsers = () => {
		const ids = chat.getConnectedUsers().map((user) => {
			return user.id;
		});

		chat.emit('updateOnlineUsers', ids);
	};

	chat.sendMessage = (conversationId, message) => {
		UserConversation.findAll({
			where: {
				conversationId
			}
		}).map((record) => {
			return record.userId;
		}).then((userIds) => {
			const connectedUsers = chat.getConnectedUsers();

			//broadcast the message to all online users that belong to this conversation
			connectedUsers.forEach((user) => {
				if (userIds.includes(user.id)) {
					chat.to(user.socketId).emit('message', message);
				}
			});
		}).catch((err) => {
			sendSocketError(chat, err);
		});
	};

	return chat;
};

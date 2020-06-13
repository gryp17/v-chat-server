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

	chat.newUser = (userId) => {
		User.findByPk(userId, {
			attributes: {
				exclude: [
					'password'
				]
			},
			include: [
				{
					model: Conversation
				}
			]
		}).then((user) => {
			const userJson = user.toJSON();

			userJson.conversations = userJson.conversations.map((conversation) => {
				return conversation.id;
			});

			chat.emit('newUser', userJson);
		}).catch((err) => {
			sendSocketError(chat, err);
		});
	};

	chat.newConversation = (conversation, userIds) => {
		const connectedUsers = chat.getConnectedUsers();

		//broadcast the message to the users that are online
		connectedUsers.forEach((user) => {
			if (userIds.includes(user.id)) {
				chat.to(user.socketId).emit('newConversation', conversation);
			}
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

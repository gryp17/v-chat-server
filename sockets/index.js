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

	/**
	 * Notifies all clients about the new user
	 * @param {Number} userId
	 */
	chat.newUser = async (userId) => {
		try {
			const user = await User.findByPk(userId, {
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
			});

			const userJson = user.toJSON();

			userJson.conversations = userJson.conversations.map((conversation) => {
				return conversation.id;
			});

			chat.emit('newUser', userJson);
		} catch (err) {
			sendSocketError(chat, err);
		}
	};

	/**
	 * Notifies the provided users about the new conversation
	 * @param {Object} conversation
	 * @param {Array} userIds
	 */
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

	/**
	 * Emits the list of online users
	 */
	chat.updateOnlineUsers = () => {
		const ids = chat.getConnectedUsers().map((user) => {
			return user.id;
		});

		chat.emit('updateOnlineUsers', ids);
	};

	/**
	 * Sends a new message to all users in the conversation
	 * @param {Number} conversationId
	 * @param {Object} message
	 */
	chat.sendMessage = async (conversationId, message) => {
		try {
			const userIds = await UserConversation.findAll({
				where: {
					conversationId
				}
			}).map((record) => {
				return record.userId;
			});

			const connectedUsers = chat.getConnectedUsers();

			//broadcast the message to all online users that belong to this conversation
			connectedUsers.forEach((user) => {
				if (userIds.includes(user.id)) {
					chat.to(user.socketId).emit('message', message);
				}
			});
		} catch (err) {
			sendSocketError(chat, err);
		}
	};

	/**
	 * Updates the user data
	 * @param {Object} user
	 */
	chat.updateUser = (user) => {
		chat.emit('updateUser', user);
	};

	return chat;
};

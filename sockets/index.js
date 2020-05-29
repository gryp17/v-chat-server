const _ = require('lodash');
const createSocket = require('socket.io');
const { sockedIsLoggedIn } = require('../middleware/authentication');
const { UserConversation, Conversation, User, Message } = require('../models');
const { sendSocketError } = require('../utils');

module.exports = (server) => {
	const io = createSocket(server);

	//checks if the socket.io requests are authorized
	io.use(sockedIsLoggedIn);

	io.on('connection', (socket) => {
		//update the online users list for everybody
		io.emit('updateOnlineUsers', getConnectedUsers());

		getUserConversations(socket.user.id).then((conversations) => {
			socket.emit('updateConversations', conversations);
		}).catch((err) => {
			sendSocketError(io, err);
		});
	});

	/**
	 * Helper function that returns an array of all connected users
	 * @returns {Array}
	 */
	function getConnectedUsers() {
		const users = [];

		_.forOwn(io.sockets.connected, (data, socketId) => {
			//set the socketId parameter
			data.user.socketId = socketId;
			users.push(data.user);
		});

		return users;
	}

	function getUserConversations(userId) {
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
		});
	}
};

const createSocket = require('socket.io');
const { sockedIsLoggedIn } = require('../middleware/authentication');
const { UserConversation, Conversation, User, Message } = require('../models');
const { sendSocketError } = require('../utils');

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

module.exports = (server) => {
	const io = createSocket(server);

	//checks if the socket.io requests are authorized
	io.use(sockedIsLoggedIn);

	io.on('connection', (socket) => {
		getUserConversations(socket.user.id).then((conversations) => {
			io.emit('updateConversations', conversations);
		}).catch((err) => {
			sendSocketError(io, err);
		});
	});
};

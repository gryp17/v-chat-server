const createSocket = require('socket.io');
const { sockedIsLoggedIn } = require('../middleware/authentication');

module.exports = (server) => {
	const io = createSocket(server);

	//checks if the socket.io requests are authorized
	io.use(sockedIsLoggedIn);

	io.on('connection', (socket) => {
		console.log('RECEIVED NEW SOCKET CONNECTION!!!!!!!!!!!');

		io.emit('test', 'test');
	});
};

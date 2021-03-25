const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendApiError } = require('../utils');

const verifyToken = (token) => {
	if (!token) {
		return false;
	}

	try {
		return jwt.verify(token, config.auth.secret);
	} catch (err) {
		return false;
	}
};

module.exports = {
	isLoggedIn(req, res, next) {
		const token = req.body.token || req.query.token || req.headers.token;
		const user = verifyToken(token);

		if (!user) {
			return sendApiError(res, config.errorCodes.INVALID_AUTHENTICATION_TOKEN);
		}

		req.user = user;
		next();
	},
	sockedIsLoggedIn(socket, next) {
		const token = socket.handshake.query.token;
		const user = verifyToken(token);

		if (!user) {
			return next(new Error(config.errorCodes.INVALID_AUTHENTICATION_TOKEN));
		}

		socket.user = user;
		next();
	}
};

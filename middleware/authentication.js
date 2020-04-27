const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendApiError } = require('../utils');

module.exports = {
	verifyToken(req, res, next) {
		const token = req.body.token || req.query.token || req.headers.token;

		if (!token) {
			return sendApiError(res, 'Missing authentication token');
		}

		jwt.verify(token, config.auth.secret, (err, user) => {
			if (err) {
				return sendApiError(res, 'Invalid authentication token');
			}

			req.user = user;
			next();
		});
	}
};

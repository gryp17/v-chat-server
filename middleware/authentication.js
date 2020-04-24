const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
	verifyToken(req, res, next) {
		const token = req.body.token || req.query.token || req.headers.token;

		if (!token) {
			return res.send({
				apiError: 'Missing authentication token'
			});
		}

		jwt.verify(token, config.auth.secret, (err, user) => {
			if (err) {
				return res.send({
					apiError: 'Invalid authentication token'
				});
			}

			req.user = user;
			next();
		});
	}
};

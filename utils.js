const bcrypt = require('bcrypt');

module.exports = {
	makeHash(value, saltRounds = 10) {
		return bcrypt.hash(value, saltRounds);
	},
	compareHash(value, hash) {
		return bcrypt.compare(value, hash);
	},
	sendError(res, payload) {
		res.json({
			error: payload
		});
	},
	sendApiError(res, payload) {
		res.json({
			apiError: payload
		});
	},
	sendResponse(res, payload) {
		res.json(payload);
	}
};

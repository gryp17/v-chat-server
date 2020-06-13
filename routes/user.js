
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { User } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

router.get('/all', isLoggedIn, async (req, res) => {
	try {
		const users = await User.findAll({
			attributes: [
				'id',
				'displayName',
				'bio',
				'avatar',
				'createdAt',
				'updatedAt'
			]
		});

		sendResponse(res, users);
	} catch (err) {
		sendApiError(res, err);
	}
});

module.exports = router;

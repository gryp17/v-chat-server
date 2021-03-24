
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { Settings } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

router.get('/', isLoggedIn, async (req, res) => {
	try {
		const settings = await Settings.findOne({
			where: {
				userId: req.user.id
			}
		});

		sendResponse(res, settings.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

module.exports = router;

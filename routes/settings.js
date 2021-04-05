
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { Settings } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

const rules = {
	updateSettings: {
		showMessageNotifications: ['required', 'boolean'],
		showOnlineStatusNotifications: ['required', 'boolean']
	}
};

/**
 * Returns the current user settings
 */
router.get('/', isLoggedIn, async (req, res) => {
	try {
		const settingsRecord = await Settings.findOne({
			where: {
				userId: req.session.user.id
			}
		});

		sendResponse(res, settingsRecord.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

/**
 * Updates the user settings
 */
router.put('/', isLoggedIn, validate(rules.updateSettings), async (req, res) => {
	try {
		const settingsRecord = await Settings.findOne({
			where: {
				userId: req.session.user.id
			}
		});

		await settingsRecord.update({
			showMessageNotifications: req.body.showMessageNotifications,
			showOnlineStatusNotifications: req.body.showOnlineStatusNotifications
		});

		sendResponse(res, settingsRecord.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

module.exports = router;

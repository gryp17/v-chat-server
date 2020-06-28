
const express = require('express');
const sequelize = require('sequelize');
const multipart = require('connect-multiparty');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { uploadAvatar } = require('../middleware/files');
const { User } = require('../models');
const { sendResponse, sendApiError, sendError } = require('../utils');
const { errorCodes } = require('../config');

const router = express.Router();

const rules = {
	updateUser: {
		displayName: ['required', 'min-3', 'max-30'],
		password: ['optional', 'strong-password', 'max-100'],
		repeatPassword: 'matches(password)',
		bio: ['optional', 'max-200'],
		avatar: ['optional', 'valid-avatar']
	}
};

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

router.put('/', isLoggedIn, multipart(), validate(rules.updateUser), uploadAvatar, async (req, res) => {
	const { displayName, password, bio } = req.body;
	const avatar = req.files.avatar ? req.files.avatar.uploadedTo : null;

	try {
		//TODO: might need to move this check to the validator middleware so it's done before uploading the files...

		//check if the display name is used by another user
		const user = await User.findOne({
			where: {
				displayName,
				id: {
					[sequelize.Op.not]: req.user.id
				}
			}
		});

		if (user) {
			return sendError(res, {
				displayName: errorCodes.ALREADY_IN_USE
			});
		}

		//TODO: update the user data
		//TODO: try to update the user session once the data is updated
		//TODO: send a socket io event to all users

		sendResponse(res, true);
	} catch (err) {
		sendApiError(res, err);
	}
});

module.exports = router;


const express = require('express');
const sequelize = require('sequelize');
const multipart = require('connect-multiparty');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const md5 = require('md5');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { User } = require('../models');
const { sendResponse, sendApiError, sendError, makeHash } = require('../utils');
const { errorCodes, uploads } = require('../config');

const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

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
				'avatarLink',
				'createdAt',
				'updatedAt'
			]
		});

		sendResponse(res, users);
	} catch (err) {
		sendApiError(res, err);
	}
});

router.put('/', isLoggedIn, multipart(), validate(rules.updateUser), async (req, res) => {
	const chat = app.get('chat');
	const { displayName, password, bio } = req.body;

	const updatedFields = {
		displayName,
		bio
	};

	try {
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

		if (password) {
			const hashedPassword = await makeHash(password);
			updatedFields.password = hashedPassword;
		}

		if (req.files && req.files.avatar) {
			const avatar = await uploadAvatar(req.user.id, req.files.avatar);
			updatedFields.avatar = avatar;
		}

		//update the user data
		await User.update(updatedFields, {
			where: {
				id: req.user.id
			}
		});

		const updatedUser = await User.findByPk(req.user.id, {
			attributes: [
				'id',
				'displayName',
				'bio',
				'avatar',
				'avatarLink',
				'createdAt',
				'updatedAt'
			]
		});

		//notify all users about the changes
		chat.updateUser(updatedUser.toJSON());

		sendResponse(res, updatedUser.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

/**
 * Uploads the submited avatar to the avatars directory
 */
async function uploadAvatar(userId, file) {
	let extension = path.extname(file.originalFilename).replace('.', '').toLowerCase();
	extension = extension ? `.${extension}` : '';

	const user = await User.findByPk(userId);

	//if the user doesn't use the default avatar delete his current avatar before uploading the new one
	if (user && user.avatar !== uploads.avatars.defaultAvatar) {
		const oldAvatar = path.join(__dirname, uploads.avatars.directory, user.avatar);
		await unlink(oldAvatar);
	}

	//rename/move the avatar file
	const username = user.displayName;
	const avatar = `${md5(username) + new Date().getTime()}${extension}`;
	const destination = path.join(__dirname, uploads.avatars.directory, avatar);

	//move the temporal file to the real avatars directory
	await rename(file.path, destination);

	return avatar;
}

module.exports = router;

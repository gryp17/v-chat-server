const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const md5 = require('md5');
const { User } = require('../models');
const config = require('../config');

const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

module.exports = {
	/**
	 * Uploads the submited avatar to the avatars directory
	 * It modifies the req object adding the new avatar filename in req.files.avatar.uploadedTo
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
	 */
	async uploadAvatar(req, res, next) {
		//if no file has been submited
		if (!req.files.avatar) {
			return next();
		}

		const file = req.files.avatar;
		const extension = path.extname(file.originalFilename).replace('.', '').toLowerCase();

		const user = await User.findByPk(req.user.id);

		//if the user doesn't use the default avatar delete his current avatar before uploading the new one
		if (user && user.avatar !== config.uploads.avatars.defaultAvatar) {
			try {
				const oldAvatar = path.join(__dirname, config.uploads.avatars.directory, user.avatar);
				await unlink(oldAvatar);
			} catch (err) {
				return next(err);
			}
		}

		//rename/move the avatar file
		const username = user.displayName;
		const avatar = `${md5(username) + new Date().getTime()}.${extension}`;
		const destination = path.join(__dirname, config.uploads.avatars.directory, avatar);

		//move the temporal file to the real avatars directory
		try {
			await rename(file.path, destination);
			req.files.avatar.uploadedTo = avatar;
		} catch (err) {
			return next(err);
		}

		next();
	}
};

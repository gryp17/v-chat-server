
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { verifyToken } = require('../middleware/authentication');
const { sendResponse, sendError, sendApiError, compareHash } = require('../utils');

const router = express.Router();

router.get('/handshake', (req, res, next) => {
	sendResponse(res, {
		success: true
	});
});

router.post('/login', (req, res, next) => {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({
		where: {
			username
		}
	}).then((record) => {
		if (!record) {
			return sendError(res, {
				password: 'invalid_login'
			});
		}

		compareHash(password, record.password).then((valid) => {
			if (!valid) {
				return sendError(res, {
					password: 'invalid_login'
				});
			}

			const user = record.toJSON();
			delete user.password;

			const token = jwt.sign(user, config.auth.secret, {
				expiresIn: 86400 // expires in 24 hours
			});

			sendResponse(res, {
				user,
				token
			});
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

router.get('/session', verifyToken, (req, res, next) => {
	sendResponse(res, {
		user: req.user
	});
});

module.exports = router;

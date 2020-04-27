
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

router.get('/login', (req, res, next) => {
	const dummyData = {
		username: 'plamen',
		password: '1234'
	};

	User.findOne({
		where: {
			username: dummyData.username
		}
	}).then((record) => {
		if (!record) {
			return sendError(res, {
				password: 'invalid_login'
			});
		}

		compareHash(dummyData.password, record.password).then((valid) => {
			if (!valid) {
				return sendError(res, {
					password: 'invalid_login'
				});
			}

			const token = jwt.sign(record.toJSON(), config.auth.secret, {
				expiresIn: 86400 // expires in 24 hours
			});

			sendResponse(res, {
				success: true,
				token
			});
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

router.get('/test', verifyToken, (req, res, next) => {
	sendResponse(res, {
		success: true
	});
});

module.exports = router;

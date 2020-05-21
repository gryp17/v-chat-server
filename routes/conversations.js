
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { Conversation, User } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
	//find all conversations that the current user is part of
	Conversation.findAll({
		include: {
			model: User,
			through: {
				where: {
					userId: req.user.id
				}
			},
			attributes: {
				exclude: [
					'password'
				]
			}
		}
	}).then((conversations) => {
		sendResponse(res, conversations);
	}).catch((err) => {
		sendApiError(res, err);
	});
});

module.exports = router;

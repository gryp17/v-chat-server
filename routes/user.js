
const express = require('express');
const { isLoggedIn } = require('../middleware/authentication');
const { User } = require('../models');
const { sendResponse, sendApiError } = require('../utils');

const router = express.Router();

router.get('/all', isLoggedIn, (req, res) => {
	User.findAll({
		attributes: [
			'id',
			'displayName',
			'bio',
			'avatar',
			'createdAt',
			'updatedAt'
		]
	}).then((users) => {
		sendResponse(res, users);
	}).catch((err) => {
		console.log(err);
		sendApiError(res, err);
	});
});

module.exports = router;

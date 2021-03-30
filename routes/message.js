
const sequelize = require('sequelize');
const express = require('express');
const multipart = require('connect-multiparty');
const escapeHtml = require('escape-html');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { UserConversation, Message, File } = require('../models');
const { sendResponse, sendApiError } = require('../utils');
const { uploads, errorCodes } = require('../config');

const rename = promisify(fs.rename);

const router = express.Router();

const rules = {
	addMessage: {
		conversationId: ['required', 'number'],
		content: 'required'
	},
	getMessages: {
		conversationId: ['required', 'number'],
		limit: ['required', 'number'],
		offset: ['required', 'number']
	},
	addFileMessage: {
		conversationId: ['required', 'number'],
		file: ['required', 'valid-attachment']
	}
};

router.post('/', isLoggedIn, validate(rules.addMessage), async (req, res) => {
	const chat = app.get('chat');
	const { conversationId, content } = req.body;

	try {
		const userConversationRecord = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.session.user.id
			}
		});

		if (!userConversationRecord) {
			throw new Error(errorCodes.INVALID_CONVERSATION_ID);
		}

		const messageRecord = await Message.create({
			type: 'text',
			conversationId,
			content: escapeHtml(content),
			userId: req.session.user.id
		});

		await UserConversation.update({
			unread: true
		}, {
			where: {
				conversationId,
				userId: {
					[sequelize.Op.not]: req.session.user.id
				}
			}
		});

		chat.sendMessage(conversationId, messageRecord.toJSON());
		sendResponse(res, messageRecord.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

router.get('/', isLoggedIn, validate(rules.getMessages), async (req, res) => {
	const { conversationId, limit, offset } = req.query;

	try {
		const userConversationRecord = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.session.user.id
			}
		});

		if (!userConversationRecord) {
			throw new Error(errorCodes.INVALID_CONVERSATION_ID);
		}

		const messages = await Message.findAll({
			where: {
				conversationId
			},
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [
				['createdAt', 'desc']
			],
			include: [
				{
					model: File
				}
			]
		});

		sendResponse(res, messages);
	} catch (err) {
		sendApiError(res, err);
	}
});

router.post('/file', isLoggedIn, multipart(), validate(rules.addFileMessage), async (req, res) => {
	const chat = app.get('chat');
	const { conversationId } = req.body;
	const file = req.files.file;

	try {
		const userConversationRecord = await UserConversation.findOne({
			where: {
				conversationId,
				userId: req.session.user.id
			}
		});

		if (!userConversationRecord) {
			throw new Error(errorCodes.INVALID_CONVERSATION_ID);
		}

		const attachment = await uploadAttachment(req.session.user.id, file);

		const messageRecord = await Message.create({
			type: 'file',
			conversationId: parseInt(conversationId),
			userId: req.session.user.id,
			file: {
				type: file.type,
				name: attachment,
				originalName: file.originalFilename,
				size: file.size
			}
		}, {
			include: File
		});

		await UserConversation.update({
			unread: true
		}, {
			where: {
				conversationId,
				userId: {
					[sequelize.Op.not]: req.session.user.id
				}
			}
		});

		chat.sendMessage(conversationId, messageRecord.toJSON());
		sendResponse(res, messageRecord.toJSON());
	} catch (err) {
		sendApiError(res, err);
	}
});

/**
 * Uploads the submited file to the attachments directory
 */
async function uploadAttachment(userId, file) {
	let extension = path.extname(file.originalFilename).replace('.', '').toLowerCase();
	extension = extension ? `.${extension}` : '';

	//rename/move the file
	const randomNumber = Math.floor((Math.random() * 999999) + 1);
	const attachment = `${userId}_${new Date().getTime()}${randomNumber}${extension}`;
	const destination = path.join(__dirname, uploads.attachments.directory, attachment);

	//move the temporal file to the real attachments directory
	await rename(file.path, destination);

	return attachment;
}

module.exports = router;

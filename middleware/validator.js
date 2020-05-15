const path = require('path');
const _ = require('lodash');
const { sendError, compareHash } = require('../utils');
const config = require('../config');

const { User } = require('../models');

const MIN_PASSWORD_LENGTH = 6;

/**
 * Helper function that checks if the provided field is a string
 * @param {String} value
 * @returns {Boolean}
 */
const isString = (value) => {
	return typeof value === 'string';
};

/**
 * Helper function that checks if the provided field is set
 * @param {Object} data
 * @param {Array} files
 * @param {String} field
 * @returns {Boolean}
 */
const isSet = (data, files, field) => {
	const value = data[field];

	if (isString(value)) {
		return value.trim().length > 0;
	}
	if (files && files[field]) {
		const file = files[field];
		return file.originalFilename.length !== 0;
	}
	return typeof value !== 'undefined';
};

/**
 * Helper function that checks if the provided field is a boolean
 * @param {Boolean} value
 * @returns {Boolean}
 */
const isBoolean = (value) => {
	return typeof value === 'boolean';
};

/**
 * Helper function that checks if the provided field is an integer
 * @param {String} value
 * @returns {Boolean}
 */
const isInteger = (value) => {
	return typeof value === 'number' && (value % 1) === 0;
};

/**
 * Helper function that checks if the provided field is a valid email
 * @param {String} value
 * @returns {Boolean}
 */
const isEmail = (value) => {
	const pattern = /^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i;
	return pattern.test(value);
};

/**
 * Helper function that checks if the provided field is a valid/strong password
 * @param {String} value
 * @returns {Boolean}
 */
const isStrongPassword = (value) => {
	return value.length >= MIN_PASSWORD_LENGTH && /\d+/.test(value) && /[a-z]+/i.test(value);
};


/**
* Generates the async validation tasks
* @param {Object} asyncValidations
* @param {Object} req
* @returns {Array}
*/
const generateAsyncTasks = (asyncValidations, req) => {
	const asyncTasks = [];

	_.forOwn(asyncValidations, (validations, field) => {
		validations.forEach((validation) => {
			//"unique" rule
			if (validation.rule === 'unique') {
				//unique displayName
				if (validation.field === 'displayName') {
					asyncTasks.push(
						User.findOne({
							where: {
								displayName: validation.fieldValue.trim()
							}
						}).then((user) => {
							if (user) {
								return {
									field,
									error: 'Display name already in use'
								};
							}
						})
					);
				}

				//unique email
				if (validation.field === 'email') {
					asyncTasks.push(
						User.findOne({
							where: {
								email: validation.fieldValue.trim()
							}
						}).then((user) => {
							if (user) {
								return {
									field,
									error: 'Email already in use'
								};
							}
						})
					);
				}
			}

			//"current-password" rule
			if (validation.rule === 'current-password') {
				asyncTasks.push(
					User.findByPk(req.user.id)
						.then((user) => {
							return compareHash(validation.fieldValue, user.password);
						}).then((valid) => {
							if (!valid) {
								return {
									field,
									error: 'Wrong password'
								};
							}
						})
				);
			}
		});
	});

	return asyncTasks;
};

/**
 * Validates all request parameters using the provided rules
 * @param {Array|String} rules
 * @returns {Function}
 */
const validate = (rules) => {
	return (req, res, next) => {
		const data = req.body;
		const files = req.files;
		const asyncRules = ['unique', 'current-password']; //list of async rules
		const asyncValidations = {};
		const errors = {};

		//for each field
		fieldLoop:
		for (const field in rules) {
			let fieldRules = rules[field];
			const fieldValue = data[field];

			//convert the string into array if it's not an array already
			if (fieldRules.constructor !== Array) {
				fieldRules = fieldRules.split(',');
			}

			//for each rule
			for (let i = 0; i < fieldRules.length; i++) {
				const rule = fieldRules[i].trim();

				//"optional" rule (used together with other rules. if the field is not set all other rules will be skipped. however if the field is set the rest of the validations will be run)
				//example: ["optional", "boolean"]
				if (rule === 'optional') {
					if (!isSet(data, files, field)) {
						continue fieldLoop;
					}
				}

				//"required" rule
				if (rule === 'required') {
					if (!isSet(data, files, field)) {
						errors[field] = 'This field is required';
						continue fieldLoop;
					}
				}

				//"boolean" rule
				if (rule === 'boolean') {
					if (!isBoolean(fieldValue)) {
						errors[field] = 'Invalid boolean value';
						continue fieldLoop;
					}
				}

				//"integer"
				if (rule === 'integer') {
					if (!isInteger(fieldValue)) {
						errors[field] = 'Invalid integer value';
						continue fieldLoop;
					}
				}

				//"email" rule
				if (rule === 'email') {
					if (!isEmail(fieldValue)) {
						errors[field] = 'Invalid email';
						continue fieldLoop;
					}
				}

				//"strong-password" rule
				if (rule === 'strong-password') {
					if (!isStrongPassword(fieldValue)) {
						errors[field] = `Must contain at least ${MIN_PASSWORD_LENGTH} characters, a digit and a letter`;
						continue fieldLoop;
					}
				}

				//"valid-avatar" rule
				if (rule === 'valid-avatar') {
					const file = files[field];
					const extension = path.extname(file.originalFilename).replace('.', '').toLowerCase();
					const maxSize = config.uploads.avatars.maxSize;
					const validExtensions = config.uploads.avatars.validExtensions;

					//max file size
					if (file.size > maxSize) {
						errors[field] = `The avatar is bigger than ${maxSize / 1000000}MB`;
						continue fieldLoop;
					}

					//valid extensions
					if (validExtensions.indexOf(extension) === -1) {
						errors[field] = `Invalid file. (Valid extensions: ${validExtensions.join(', ')})`;
						continue fieldLoop;
					}
				}

				//min-\d+ rule
				//examples: min-5, min-10, min-50
				const minMatches = rule.match(/min-(\d+)/);
				if (minMatches && minMatches[1]) {
					const limit = minMatches[1];

					if (fieldValue.trim().length < limit) {
						errors[field] = `Must be at least ${limit} chracters`;
						continue fieldLoop;
					}
				}

				//max-\d+ rule
				//examples: max-5, max-10, max-50
				const maxMatches = rule.match(/max-(\d+)/);
				if (maxMatches && maxMatches[1]) {
					const limit = maxMatches[1];

					if (fieldValue.trim().length > limit) {
						errors[field] = `Must not exceed ${limit} chracters`;
						continue fieldLoop;
					}
				}

				//matches(...) rule
				//examples: matches(password)
				const matches = rule.match(/matches\((.+?)\)/);
				if (matches && matches[1]) {
					const matchField = matches[1];

					if (fieldValue !== data[matchField]) {
						errors[field] = "The fields don't match";
						continue fieldLoop;
					}
				}

				//in() rule
				//exmaple: in(1, 2, 3)
				const inMatches = rule.match(/in\((.+?)\)/);
				if (inMatches && inMatches[1]) {
					let values = inMatches[1];
					values = values.split(/\s*,\s*/);

					const index = _.findIndex(values, (value) => {
						//no, the types don't need to match
						return fieldValue == value; //eslint-disable-line
					});

					if (index === -1) {
						errors[field] = `Invalid value. (Accepted values: ${values.join(', ')})`;
						continue fieldLoop;
					}
				}

				//async rules
				//since those rules are async we add them to a queue that is executed only if all sync validations for this field have passed
				if (asyncRules.indexOf(rule) !== -1) {
					if (!asyncValidations[field]) {
						asyncValidations[field] = [];
					}

					asyncValidations[field].push({
						rule,
						field,
						fieldValue
					});
				}
			}
		}

		//run all async tasks (if there are any)
		Promise.all(generateAsyncTasks(asyncValidations, req)).then((validationErrors) => {
			//check if there are any async validation errors
			validationErrors.forEach((validationError) => {
				if (validationError) {
					errors[validationError.field] = validationError.error;
				}
			});

			if (Object.keys(errors).length > 0) {
				sendError(res, errors);
			} else {
				next();
			}
		}).catch((err) => {
			next(err);
		});
	};
};

module.exports = {
	validate,
	generateAsyncTasks,
	isSet,
	isString,
	isBoolean,
	isInteger,
	isEmail,
	isStrongPassword
};
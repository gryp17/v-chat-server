module.exports = {
	port: 3333,
	cdn: 'http://127.0.0.1:3333',
	auth: {
		secret: 'EXxCP8sDAfPM7vJ4z6MQeN6oJzSBSh9NKGuSiNCs32qjngaRPC0IgiABV7MpCYu'
	},
	db: {
		host: '127.0.0.1',
		database: 'v-chat',
		user: 'root',
		password: '1234'
	},
	uploads: {
		avatars: {
			directory: '../public/avatars/',
			maxSize: 1000000,
			validExtensions: ['png', 'jpg', 'jpeg'],
			defaultAvatar: 'default.png'
		},
		attachments: {
			directory: '../public/attachments/',
			maxSize: 20000000
		}
	},
	minPasswordLength: 6,
	errorCodes: {
		REQUIRED: 'required',
		INVALID_BOOLEAN: 'invalid_boolean',
		INVALID_INTEGER: 'invalid_integer',
		INVALID_EMAIL: 'invalid_email',
		STRONG_PASSWORD_LENGTH_: 'strong_password_length_', //strong_password_length_(\d+)
		EXCEEDS_MAX_FILE_SIZE_: 'exceeds_max_file_size_', //exceeds_max_file_size_(\d+)
		INVALID_FILE_EXTENSION_: 'invalid_file_extension_', //invalid_file_extension_[]
		BELOW_CHARACTERS_: 'below_characters_', //below_characters_(\d+)
		EXCEEDS_CHARACTERS_: 'exceeds_characters_', //exceeds_characters_(\d+)
		FIELDS_DONT_MATCH: 'fields_dont_match',
		NOT_IN_LIST_: 'not_in_list_', //not_in_list_[]
		ALREADY_IN_USE: 'already_in_use',
		WRONG_PASSWORD: 'wrong_password',
		// api error codes
		INVALID_AUTHENTICATION_TOKEN: 'invalid_authentication_token',
		INVALID_CONVERSATION_ID: 'invalid_conversation_id',
		INVALID_USER_ID: 'invalid_user_id',
		DUPLICATE_CONVERSATION: 'duplicate_conversation'
	}
};

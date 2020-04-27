module.exports = {
	sendError(res, payload) {
		res.json({
			error: payload
		});
	},
	sendApiError(res, payload) {
		res.json({
			apiError: payload
		});
	},
	sendResponse(res, payload) {
		res.json(payload);
	}
};

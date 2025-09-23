'use strict';

// Middleware to allow viewing another user's favorites
function canViewUserFavorites(req, res, next) {
	const uid = Number(req.params.uid);
	const user = res.locals.uid;

	// Only admins/teachers or the user themselves can access
	if (user.isAdmin || user.isTeacher || user.id === uid) {
		return next();
	}

	return res.status(403).json({ error: 'Forbidden' });
}

module.exports = { canViewUserFavorites };

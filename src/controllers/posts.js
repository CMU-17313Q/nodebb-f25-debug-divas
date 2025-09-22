'use strict';

const nconf = require('nconf');
const querystring = require('querystring');

const meta = require('../meta');
const posts = require('../posts');
const privileges = require('../privileges');
const activitypub = require('../activitypub');
const utils = require('../utils');

const helpers = require('./helpers');

const postsController = module.exports;

postsController.redirectToPost = async function (req, res, next) {
  const pid = parsePid(req.params.pid);
  if (!pid) return next();

  await maybeAssertActivityPubNote(pid, req.uid);

  const { canRead, path } = await fetchAccessAndPath(pid, req.uid);
  if (!path) return next();
  if (!canRead) return helpers.notAllowed(req, res);

  setActivityPubLinkHeaderIfEnabled(res, req.params.pid);
  return helpers.redirect(res, buildUrlWithQuery(path, req.query), true);
};

// --- Local helpers ---

function parsePid(raw) {
  return utils.isNumber(raw) ? parseInt(raw, 10) : raw;
}

async function maybeAssertActivityPubNote(pid, uid) {
  if (!utils.isNumber(pid) && uid && meta.config.activitypubEnabled) {
    const exists = await posts.exists(pid);
    if (!exists) {
      await activitypub.notes.assert(uid, pid);
    }
  }
}

async function fetchAccessAndPath(pid, uid) {
  const [canRead, path] = await Promise.all([
    privileges.posts.can('topics:read', pid, uid),
    posts.generatePostPath(pid, uid),
  ]);
  return { canRead, path };
}

function setActivityPubLinkHeaderIfEnabled(res, routePid) {
  if (meta.config.activitypubEnabled) {
    res.set(
      'Link',
      `<${nconf.get('url')}/post/${routePid}>; rel="alternate"; type="application/activity+json"`
    );
  }
}

function buildUrlWithQuery(path, query) {
  const qs = querystring.stringify(query);
  return qs ? `${path}?${qs}` : path;
}


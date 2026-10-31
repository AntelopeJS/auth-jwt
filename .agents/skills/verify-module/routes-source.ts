/** The consumer module the README's quick start describes, written as the JavaScript its decorators compile to: a login route that sets the cookie and a protected route that reads it back. */
export const ROUTES_SOURCE = String.raw`"use strict";
const { Context, Controller, Get, Post } = require("@antelopejs/interface-api");
const { Authentication, SignServerResponse } = require("@antelopejs/interface-auth");

class SessionController extends Controller("/session") {
  async login(context) {
    await SignServerResponse(context.rawResponse, { userId: "42" }, { expiresIn: "1h" }, { httpOnly: true, path: "/" });
    return { ok: true };
  }

  me(session) {
    return session;
  }
}

const prototype = SessionController.prototype;
Context()(prototype, "login", 0);
Post("/login")(prototype, "login", Object.getOwnPropertyDescriptor(prototype, "login"));
Authentication()(prototype, "me", 0);
Get("/me")(prototype, "me", Object.getOwnPropertyDescriptor(prototype, "me"));

exports.construct = function construct() {};
exports.start = function start() {};
exports.stop = function stop() {};
exports.destroy = function destroy() {};
`;

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  rateLimit: () => rateLimit
});
module.exports = __toCommonJS(index_exports);

// src/redis/slidingWindowExecutor.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var SlidingWindowExecutor = class {
  constructor(redis) {
    this.scriptLoaded = false;
    this.redis = redis;
  }
  async loadScript() {
    if (this.scriptLoaded) return;
    const scriptPath = import_path.default.join(__dirname, "..", "scripts", "slidingWindow.lua");
    const script = import_fs.default.readFileSync(scriptPath, "utf8");
    this.redis.defineCommand("slidingWindowExecutorCommand", {
      numberOfKeys: 1,
      lua: script
    });
    this.scriptLoaded = true;
  }
  async execute(key, window, limit, currentTime, member) {
    if (!this.scriptLoaded) {
      throw new Error("Lua script not loaded");
    }
    const result = await this.redis.slidingWindowExecutorCommand(
      key,
      window,
      limit,
      currentTime,
      member
    );
    return result;
  }
};

// src/core/limiter.ts
var import_nanoid = require("nanoid");
var RateLimiter = class {
  constructor(executor) {
    this.executor = executor;
  }
  async check(identifier, feature, window, limit) {
    const key = `rate_limit:${identifier}:${feature}`;
    const currentTime = Date.now();
    const member = `${currentTime}-${(0, import_nanoid.nanoid)()}`;
    const result = await this.executor.execute(
      key,
      window,
      limit,
      currentTime,
      member
    );
    return {
      allowed: result[0] === 1,
      count: result[1],
      resetTime: result[2]
    };
  }
};

// src/middleware/rateLimiter.ts
function rateLimit(config) {
  const executor = new SlidingWindowExecutor(config.redis);
  const scriptReady = executor.loadScript();
  const limiter = new RateLimiter(executor);
  const window = config.window;
  const limit = config.limit;
  const feature = config.feature;
  const identifierFn = config.identifier || ((req) => req.ip);
  return async function(req, res, next) {
    try {
      await scriptReady;
      const identifier = identifierFn(req);
      const result = await limiter.check(
        identifier,
        feature,
        window,
        limit
      );
      if (!result.allowed) {
        return res.status(429).json({
          error: "Rate limit exceeded",
          resetTime: result.resetTime
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  rateLimit
});

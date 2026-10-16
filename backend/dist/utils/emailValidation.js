"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactEmailPattern = exports.normalizeValidEmail = exports.isValidEmail = exports.normalizeEmail = void 0;
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
exports.normalizeEmail = normalizeEmail;
const isValidEmail = (email) => (0, isEmail_1.default)(email, { require_tld: true });
exports.isValidEmail = isValidEmail;
const normalizeValidEmail = (value) => {
    const email = (0, exports.normalizeEmail)(value);
    return (0, exports.isValidEmail)(email) ? email : null;
};
exports.normalizeValidEmail = normalizeValidEmail;
const exactEmailPattern = (email) => new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
exports.exactEmailPattern = exactEmailPattern;

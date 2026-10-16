"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const emailValidation_1 = require("./emailValidation");
const cases = [
    ["dominic1383@gmail", false],
    ["dominic1383@gma.com", true],
    ["dominic1383@gmail.com", true],
    ["user@outlook.com", true],
    ["user@yahoo.com", true],
    ["user@", false],
    ["@gmail.com", false],
    ["user gmail@gmail.com", false],
    ["user@gmail..com", false],
    ["user+test@gmail.com", true],
];
for (const [email, expected] of cases) {
    strict_1.default.equal(Boolean((0, emailValidation_1.normalizeValidEmail)(email)), expected, email);
}
strict_1.default.equal((0, emailValidation_1.normalizeValidEmail)("  User@Example.COM  "), "user@example.com");
console.log("Email validation checks passed");

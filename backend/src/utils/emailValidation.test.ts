import assert from "node:assert/strict";
import { normalizeValidEmail } from "./emailValidation";

const cases: Array<[string, boolean]> = [
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
  assert.equal(Boolean(normalizeValidEmail(email)), expected, email);
}

assert.equal(normalizeValidEmail("  User@Example.COM  "), "user@example.com");
console.log("Email validation checks passed");

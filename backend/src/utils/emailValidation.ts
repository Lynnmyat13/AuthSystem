import isEmail from "validator/lib/isEmail";

export const normalizeEmail = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const isValidEmail = (email: string): boolean =>
  isEmail(email, { require_tld: true });

export const normalizeValidEmail = (value: unknown): string | null => {
  const email = normalizeEmail(value);
  return isValidEmail(email) ? email : null;
};

export const exactEmailPattern = (email: string): RegExp =>
  new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

declare namespace NodeJS {
    interface ProcessEnv {
        EMAIL_PASS?: string;
        EMAIL_USER?: string;
        FRONTEND_URL?: string;
        GOOGLE_CALLBACK_URL?: string;
        JWT_SECRET: string;
        SMTP_PORT?: string;
        TOKEN_EXPIRES_IN: string;
    }
}

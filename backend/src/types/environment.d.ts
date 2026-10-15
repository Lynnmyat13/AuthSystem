declare namespace NodeJS {
    interface ProcessEnv {
        ALLOWED_ORIGINS?: string;
        FRONTEND_URL?: string;
        GOOGLE_CALLBACK_URL?: string;
        JWT_SECRET: string;
        RESEND_API_KEY?: string;
        RESEND_FROM_EMAIL?: string;
        TOKEN_EXPIRES_IN: string;
    }
}

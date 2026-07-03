declare namespace NodeJS {
    interface ProcessEnv {
        JWT_SECRET: string;
        TOKEN_EXPIRES_IN: string;
    }
}

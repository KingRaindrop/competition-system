const defaultJwtSecret = 'competition-system-jwt-secret-2026';
const jwtSecret = process.env.JWT_SECRET || defaultJwtSecret;
if (process.env.NODE_ENV === 'production' && jwtSecret === defaultJwtSecret) {
    throw new Error('JWT_SECRET must be set in production');
}
export const config = {
    port: parseInt(process.env.PORT || '3000'),
    jwtSecret,
    jwtExpiresIn: '24h',
    uploadDir: 'uploads',
    maxFileSize: 500 * 1024 * 1024,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
//# sourceMappingURL=config.js.map
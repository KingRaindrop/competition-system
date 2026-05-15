export interface TokenPayload {
    userId: string;
    role: string;
}
export declare function signToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
//# sourceMappingURL=jwt.d.ts.map
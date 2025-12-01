// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Strict rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many login attempts from this IP, please try again after 15 minutes',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    skipFailedRequests: false, // Count failed requests
    handler: (req, res) => {
        console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts from this IP, please try again after 15 minutes',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 15 * 60
        });
    }
});

// Moderate rate limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
        error: 'Too many accounts created from this IP, please try again after an hour',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Registration rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many accounts created from this IP, please try again after an hour',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60 * 60
        });
    }
});

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset requests per hour
    message: {
        error: 'Too many password reset requests, please try again after an hour',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many password reset requests, please try again after an hour',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60 * 60
        });
    }
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        error: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 API rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Email verification rate limiter
const emailVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 verification emails per hour
    message: {
        error: 'Too many verification email requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
    apiLimiter,
    emailVerificationLimiter
};

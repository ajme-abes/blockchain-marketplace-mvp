// backend/src/middleware/emailRateLimiter.js
// Rate limiter that tracks by email address instead of IP

const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// In-memory store for rate limiting by email
const emailAttempts = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of emailAttempts.entries()) {
        if (now - data.resetTime > 0) {
            emailAttempts.delete(email);
        }
    }
}, 10 * 60 * 1000);

/**
 * Rate limiter for registration by email address
 * Tracks attempts per email, not per IP
 */
const registerByEmailLimiter = (req, res, next) => {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) {
        return res.status(400).json({
            error: 'Email is required',
            code: 'EMAIL_REQUIRED'
        });
    }

    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 5; // 5 attempts per email per 5 minutes

    // Get or create attempt record for this email
    let attemptData = emailAttempts.get(email);

    if (!attemptData || now > attemptData.resetTime) {
        // Create new record or reset if window expired
        attemptData = {
            count: 0,
            resetTime: now + windowMs,
            firstAttempt: now
        };
        emailAttempts.set(email, attemptData);
    }

    // Increment attempt count
    attemptData.count++;

    // Check if limit exceeded
    if (attemptData.count > maxAttempts) {
        const retryAfter = Math.ceil((attemptData.resetTime - now) / 1000);

        console.log(`🚫 Registration rate limit exceeded for email: ${email} (${attemptData.count}/${maxAttempts} attempts)`);

        return res.status(429).json({
            error: `Too many registration attempts for this email. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfter,
            attemptsLeft: 0,
            maxAttempts: maxAttempts
        });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', maxAttempts - attemptData.count);
    res.setHeader('X-RateLimit-Reset', new Date(attemptData.resetTime).toISOString());

    console.log(`✅ Registration attempt for email: ${email} (${attemptData.count}/${maxAttempts})`);

    next();
};

/**
 * Rate limiter for login by email address
 * Tracks failed login attempts per email
 */
const loginByEmailLimiter = (req, res, next) => {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) {
        return res.status(400).json({
            error: 'Email is required',
            code: 'EMAIL_REQUIRED'
        });
    }

    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5; // 5 failed attempts per email per 15 minutes

    // Get or create attempt record for this email
    let attemptData = emailAttempts.get(`login_${email}`);

    if (!attemptData || now > attemptData.resetTime) {
        // Create new record or reset if window expired
        attemptData = {
            count: 0,
            resetTime: now + windowMs,
            firstAttempt: now
        };
        emailAttempts.set(`login_${email}`, attemptData);
    }

    // Check if limit exceeded (before incrementing, will increment on failure)
    if (attemptData.count >= maxAttempts) {
        const retryAfter = Math.ceil((attemptData.resetTime - now) / 1000);

        console.log(`🚫 Login rate limit exceeded for email: ${email} (${attemptData.count}/${maxAttempts} attempts)`);

        return res.status(429).json({
            error: `Too many failed login attempts for this email. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfter,
            attemptsLeft: 0,
            maxAttempts: maxAttempts
        });
    }

    // Store attempt data in request for later use
    req.emailRateLimit = {
        email,
        attemptData,
        maxAttempts
    };

    next();
};

/**
 * Call this after a failed login to increment the counter
 */
const recordFailedLogin = (email) => {
    const attemptData = emailAttempts.get(`login_${email}`);
    if (attemptData) {
        attemptData.count++;
        console.log(`❌ Failed login for ${email} (${attemptData.count}/${5} attempts)`);
    }
};

/**
 * Call this after a successful login to reset the counter
 */
const resetLoginAttempts = (email) => {
    emailAttempts.delete(`login_${email}`);
    console.log(`✅ Login successful for ${email} - counter reset`);
};

/**
 * Combined rate limiter: IP-based (loose) + Email-based (strict)
 * This allows multiple emails from same IP, but limits per email
 */
const combinedRegisterLimiter = [
    // First check: Loose IP-based limit (prevents spam from single IP)
    rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // 50 registrations per IP per 5 minutes (very loose)
        message: {
            error: 'Too many registration requests from this network. Please try again later.',
            code: 'IP_RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true // Don't count successful registrations
    }),
    // Second check: Strict email-based limit
    registerByEmailLimiter
];

module.exports = {
    registerByEmailLimiter,
    loginByEmailLimiter,
    recordFailedLogin,
    resetLoginAttempts,
    combinedRegisterLimiter
};

// backend/src/jobs/sessionCleanup.js
const sessionService = require('../services/sessionService');

/**
 * Cleanup expired sessions
 * Run this periodically (e.g., every hour or daily)
 */
async function cleanupExpiredSessions() {
    try {
        console.log('🧹 Starting session cleanup job...');
        const result = await sessionService.cleanupExpiredSessions();
        console.log(`✅ Session cleanup completed: ${result.count} sessions removed`);
        return result;
    } catch (error) {
        console.error('❌ Session cleanup job failed:', error);
        throw error;
    }
}

/**
 * Start periodic cleanup (run every hour)
 */
function startSessionCleanupJob() {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    console.log('🚀 Starting periodic session cleanup job (every hour)');

    // Run immediately on start
    cleanupExpiredSessions();

    // Then run every hour
    setInterval(() => {
        cleanupExpiredSessions();
    }, CLEANUP_INTERVAL);
}

module.exports = {
    cleanupExpiredSessions,
    startSessionCleanupJob
};

// backend/src/jobs/sessionCleanup.js
const sessionService = require('../services/sessionService');

/**
 * Cleanup expired and inactive sessions
 * Run this periodically (e.g., every hour or daily)
 */
async function cleanupExpiredSessions() {
    try {
        console.log('🧹 Starting session cleanup job...');

        // Clean up expired sessions
        const expiredResult = await sessionService.cleanupExpiredSessions();
        console.log(`✅ Expired sessions removed: ${expiredResult.count}`);

        // Clean up inactive sessions (30 minutes of inactivity)
        const inactiveResult = await sessionService.invalidateInactiveSessions(30);
        console.log(`✅ Inactive sessions invalidated: ${inactiveResult.count}`);

        return {
            expired: expiredResult.count,
            inactive: inactiveResult.count,
            total: expiredResult.count + inactiveResult.count
        };
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

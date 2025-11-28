// Verification script for blockchain and payment fixes
// Run with: node verify-fixes.js

const { prisma } = require('./src/config/database');
const blockchainService = require('./src/services/blockchainService');
const paymentService = require('./src/services/paymentService');

async function verifyFixes() {
    console.log('🔍 Verifying Blockchain & Payment System Fixes\n');
    console.log('='.repeat(60));

    let allPassed = true;

    // Test 1: Check BlockchainRecord table exists and is accessible
    console.log('\n📋 Test 1: BlockchainRecord Table');
    try {
        const recordCount = await prisma.blockchainRecord.count();
        console.log(`✅ BlockchainRecord table accessible`);
        console.log(`   Records in table: ${recordCount}`);

        if (recordCount === 0) {
            console.log('   ⚠️  No records yet (expected if no payments processed)');
        } else {
            // Show recent records
            const recentRecords = await prisma.blockchainRecord.findMany({
                take: 3,
                orderBy: { timestamp: 'desc' },
                include: {
                    order: {
                        select: {
                            id: true,
                            totalAmount: true,
                            paymentStatus: true
                        }
                    }
                }
            });

            console.log('   Recent records:');
            recentRecords.forEach(record => {
                console.log(`   - ${record.txHash.substring(0, 20)}... (${record.status})`);
            });
        }
    } catch (error) {
        console.log(`❌ BlockchainRecord table error: ${error.message}`);
        allPassed = false;
    }

    // Test 2: Check BlockchainIdentifier table
    console.log('\n📋 Test 2: BlockchainIdentifier Table');
    try {
        const identifierCount = await prisma.blockchainIdentifier.count();
        console.log(`✅ BlockchainIdentifier table accessible`);
        console.log(`   Identifiers stored: ${identifierCount}`);

        if (identifierCount > 0) {
            const sampleIdentifiers = await prisma.blockchainIdentifier.findMany({
                take: 3,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });

            console.log('   Sample identifiers:');
            sampleIdentifiers.forEach(id => {
                console.log(`   - ${id.blockchainId} (${id.role}) - ${id.user.name}`);
            });
        }
    } catch (error) {
        console.log(`❌ BlockchainIdentifier table error: ${error.message}`);
        allPassed = false;
    }

    // Test 3: Check blockchain service methods exist
    console.log('\n📋 Test 3: Blockchain Service Methods');
    try {
        const hasRetryMethod = typeof blockchainService.recordOrderTransactionWithRetry === 'function';
        const hasDelayMethod = typeof blockchainService.delay === 'function';
        const hasRecordMethod = typeof blockchainService.recordOrderTransaction === 'function';

        if (hasRetryMethod && hasDelayMethod && hasRecordMethod) {
            console.log('✅ All blockchain service methods present');
            console.log('   - recordOrderTransactionWithRetry: ✓');
            console.log('   - delay: ✓');
            console.log('   - recordOrderTransaction: ✓');
        } else {
            console.log('❌ Some blockchain service methods missing');
            console.log(`   - recordOrderTransactionWithRetry: ${hasRetryMethod ? '✓' : '✗'}`);
            console.log(`   - delay: ${hasDelayMethod ? '✓' : '✗'}`);
            console.log(`   - recordOrderTransaction: ${hasRecordMethod ? '✓' : '✗'}`);
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Blockchain service error: ${error.message}`);
        allPassed = false;
    }

    // Test 4: Check payment service webhook verification
    console.log('\n📋 Test 4: Webhook Signature Verification');
    try {
        const hasVerifyMethod = typeof paymentService.verifyWebhookSignature === 'function';

        if (hasVerifyMethod) {
            console.log('✅ Webhook signature verification method exists');

            // Test with sample data
            const testPayload = { test: 'data' };
            const testSignature = 'test_signature';

            try {
                const result = await paymentService.verifyWebhookSignature(testSignature, testPayload);
                console.log(`   Method callable: ✓ (returned: ${result})`);

                if (!process.env.CHAPA_WEBHOOK_SECRET) {
                    console.log('   ⚠️  CHAPA_WEBHOOK_SECRET not set (development mode)');
                } else {
                    console.log('   ✓ CHAPA_WEBHOOK_SECRET configured');
                }
            } catch (error) {
                console.log(`   ⚠️  Method error: ${error.message}`);
            }
        } else {
            console.log('❌ Webhook signature verification method missing');
            allPassed = false;
        }
    } catch (error) {
        console.log(`❌ Payment service error: ${error.message}`);
        allPassed = false;
    }

    // Test 5: Check blockchain connection
    console.log('\n📋 Test 5: Blockchain Connection');
    try {
        const status = await blockchainService.getBlockchainStatus();

        if (status.connected) {
            console.log('✅ Blockchain connected');
            console.log(`   Network: ${status.network?.name || 'Unknown'}`);
            console.log(`   Chain ID: ${status.network?.chainId || 'Unknown'}`);
            console.log(`   Block: ${status.blockNumber || 'Unknown'}`);
            console.log(`   Wallet: ${status.wallet?.address || 'Unknown'}`);
            console.log(`   Balance: ${status.wallet?.balance || '0'} MATIC`);
            console.log(`   Is Owner: ${status.wallet?.isContractOwner ? '✓' : '✗'}`);

            if (!status.wallet?.isContractOwner) {
                console.log('   ⚠️  Wallet is not contract owner - blockchain recording will fail');
            }
        } else {
            console.log('⚠️  Blockchain not connected (mock mode)');
            console.log(`   Message: ${status.message}`);
        }
    } catch (error) {
        console.log(`⚠️  Blockchain connection error: ${error.message}`);
        console.log('   (This is OK if running in mock mode)');
    }

    // Test 6: Check environment variables
    console.log('\n📋 Test 6: Environment Variables');
    const requiredVars = [
        'DATABASE_URL',
        'CHAPA_SECRET_KEY',
        'CONTRACT_ADDRESS',
        'BLOCKCHAIN_PRIVATE_KEY'
    ];

    const optionalVars = [
        'CHAPA_WEBHOOK_SECRET',
        'BLOCKCHAIN_RPC_URL',
        'MARKETPLACE_COMMISSION_RATE'
    ];

    console.log('   Required:');
    requiredVars.forEach(varName => {
        const isSet = !!process.env[varName];
        console.log(`   - ${varName}: ${isSet ? '✓' : '✗'}`);
        if (!isSet) allPassed = false;
    });

    console.log('   Optional:');
    optionalVars.forEach(varName => {
        const isSet = !!process.env[varName];
        console.log(`   - ${varName}: ${isSet ? '✓' : '⚠️  (using default)'}`);
    });

    // Test 7: Check database schema
    console.log('\n📋 Test 7: Database Schema Verification');
    try {
        // Check Order table has blockchain fields
        const sampleOrder = await prisma.order.findFirst({
            select: {
                id: true,
                blockchainTxHash: true,
                blockchainRecorded: true,
                blockchainError: true
            }
        });

        if (sampleOrder !== null) {
            console.log('✅ Order table has blockchain fields');
            console.log(`   Sample order: ${sampleOrder.id}`);
            console.log(`   - blockchainTxHash: ${sampleOrder.blockchainTxHash ? '✓' : 'null'}`);
            console.log(`   - blockchainRecorded: ${sampleOrder.blockchainRecorded}`);
        } else {
            console.log('⚠️  No orders in database yet');
        }

        // Check OrderProducer table
        const orderProducerCount = await prisma.orderProducer.count();
        console.log(`✅ OrderProducer table accessible (${orderProducerCount} records)`);

        // Check ProducerPayout table
        const payoutCount = await prisma.producerPayout.count();
        console.log(`✅ ProducerPayout table accessible (${payoutCount} records)`);

    } catch (error) {
        console.log(`❌ Database schema error: ${error.message}`);
        allPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    if (allPassed) {
        console.log('✅ All critical checks passed!');
        console.log('\nYour system is ready for testing:');
        console.log('1. Create a test order');
        console.log('2. Complete payment via Chapa');
        console.log('3. Check BlockchainRecord table populated');
        console.log('4. Verify user validation working');
        console.log('5. Test retry logic (simulate network failure)');
    } else {
        console.log('⚠️  Some checks failed - review errors above');
        console.log('\nCommon fixes:');
        console.log('1. Ensure all environment variables are set');
        console.log('2. Run database migrations');
        console.log('3. Check blockchain connection');
        console.log('4. Verify wallet has MATIC for gas');
    }

    console.log('\n' + '='.repeat(60));

    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
}

// Run verification
verifyFixes().catch(error => {
    console.error('❌ Verification script error:', error);
    process.exit(1);
});

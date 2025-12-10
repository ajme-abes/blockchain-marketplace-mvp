const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { prisma } = require('../config/database');

const execAsync = promisify(exec);

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('📁 Backup directory ensured:', this.backupDir);
        } catch (error) {
            console.error('❌ Failed to create backup directory:', error);
        }
    }

    /**
     * Create a complete system backup
     * @param {string} adminId - ID of admin creating backup
     * @returns {Object} Backup information
     */
    async createSystemBackup(adminId) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupId = `backup_${Date.now()}`;
            const backupPath = path.join(this.backupDir, `${backupId}_${timestamp}`);

            console.log('💾 Starting system backup:', backupId);

            // Create backup directory
            await fs.mkdir(backupPath, { recursive: true });

            const backupInfo = {
                backupId,
                timestamp: new Date().toISOString(),
                adminId,
                files: [],
                totalSize: 0
            };

            // 1. Database Backup
            console.log('📊 Creating database backup...');
            const dbBackup = await this.createDatabaseBackup(backupPath);
            backupInfo.files.push(dbBackup);
            backupInfo.totalSize += dbBackup.size;

            // 2. Configuration Backup
            console.log('⚙️ Creating configuration backup...');
            const configBackup = await this.createConfigBackup(backupPath);
            backupInfo.files.push(configBackup);
            backupInfo.totalSize += configBackup.size;

            // 3. Upload Files Backup (if exists)
            console.log('📁 Creating uploads backup...');
            const uploadsBackup = await this.createUploadsBackup(backupPath);
            if (uploadsBackup) {
                backupInfo.files.push(uploadsBackup);
                backupInfo.totalSize += uploadsBackup.size;
            }

            // 4. Create backup manifest
            const manifestPath = path.join(backupPath, 'backup-manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(backupInfo, null, 2));

            // 5. Create compressed archive
            console.log('🗜️ Compressing backup...');
            const archivePath = await this.compressBackup(backupPath, backupId);

            // Clean up uncompressed files
            await this.cleanupDirectory(backupPath);

            console.log('✅ System backup completed:', backupId);

            return {
                backupId,
                timestamp: backupInfo.timestamp,
                size: this.formatFileSize(backupInfo.totalSize),
                archivePath,
                files: backupInfo.files.length
            };

        } catch (error) {
            console.error('❌ System backup failed:', error);
            throw new Error(`Backup failed: ${error.message}`);
        }
    }

    /**
     * Create database backup using pg_dump
     */
    async createDatabaseBackup(backupPath) {
        try {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) {
                throw new Error('DATABASE_URL not configured');
            }

            const backupFile = path.join(backupPath, 'database.sql');

            // For PostgreSQL
            if (dbUrl.includes('postgres')) {
                // Extract connection details from DATABASE_URL
                const url = new URL(dbUrl.replace('prisma+postgres://', 'postgres://'));

                const command = `pg_dump "${url.toString()}" > "${backupFile}"`;

                try {
                    await execAsync(command);
                    const stats = await fs.stat(backupFile);

                    return {
                        name: 'database.sql',
                        type: 'database',
                        size: stats.size,
                        path: backupFile
                    };
                } catch (error) {
                    // If pg_dump fails, create a JSON export instead
                    console.warn('⚠️ pg_dump not available, creating JSON export...');
                    return await this.createJsonDatabaseBackup(backupFile);
                }
            } else {
                // For other databases, create JSON export
                return await this.createJsonDatabaseBackup(backupFile);
            }
        } catch (error) {
            console.error('❌ Database backup failed:', error);
            throw error;
        }
    }

    /**
     * Create JSON database backup (fallback method)
     */
    async createJsonDatabaseBackup(backupFile) {
        try {
            const tables = ['users', 'producers', 'buyers', 'products', 'orders', 'auditLog'];
            const backup = {};

            for (const table of tables) {
                try {
                    if (prisma[table]) {
                        backup[table] = await prisma[table].findMany();
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not backup table ${table}:`, error.message);
                    backup[table] = [];
                }
            }

            const jsonBackup = JSON.stringify(backup, null, 2);
            await fs.writeFile(backupFile.replace('.sql', '.json'), jsonBackup);

            const stats = await fs.stat(backupFile.replace('.sql', '.json'));

            return {
                name: 'database.json',
                type: 'database',
                size: stats.size,
                path: backupFile.replace('.sql', '.json')
            };
        } catch (error) {
            console.error('❌ JSON database backup failed:', error);
            throw error;
        }
    }

    /**
     * Create configuration backup
     */
    async createConfigBackup(backupPath) {
        try {
            const configFiles = [
                '.env',
                'package.json',
                'prisma/schema.prisma',
                'docker-compose.yml'
            ];

            const configDir = path.join(backupPath, 'config');
            await fs.mkdir(configDir, { recursive: true });

            let totalSize = 0;

            for (const file of configFiles) {
                try {
                    const sourcePath = path.join(__dirname, '../../', file);
                    const destPath = path.join(configDir, path.basename(file));

                    await fs.copyFile(sourcePath, destPath);
                    const stats = await fs.stat(destPath);
                    totalSize += stats.size;
                } catch (error) {
                    console.warn(`⚠️ Could not backup config file ${file}:`, error.message);
                }
            }

            return {
                name: 'config',
                type: 'configuration',
                size: totalSize,
                path: configDir
            };
        } catch (error) {
            console.error('❌ Configuration backup failed:', error);
            throw error;
        }
    }

    /**
     * Create uploads backup
     */
    async createUploadsBackup(backupPath) {
        try {
            const uploadsDir = path.join(__dirname, '../../uploads');

            // Check if uploads directory exists
            try {
                await fs.access(uploadsDir);
            } catch (error) {
                console.log('ℹ️ No uploads directory found, skipping...');
                return null;
            }

            const backupUploadsDir = path.join(backupPath, 'uploads');
            await this.copyDirectory(uploadsDir, backupUploadsDir);

            const size = await this.getDirectorySize(backupUploadsDir);

            return {
                name: 'uploads',
                type: 'files',
                size,
                path: backupUploadsDir
            };
        } catch (error) {
            console.error('❌ Uploads backup failed:', error);
            return null;
        }
    }

    /**
     * Compress backup directory
     */
    async compressBackup(backupPath, backupId) {
        try {
            const archivePath = `${backupPath}.tar.gz`;
            const command = `tar -czf "${archivePath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;

            await execAsync(command);

            return archivePath;
        } catch (error) {
            console.warn('⚠️ Compression failed, keeping uncompressed backup:', error.message);
            return backupPath;
        }
    }

    /**
     * Copy directory recursively
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * Get directory size
     */
    async getDirectorySize(dirPath) {
        let totalSize = 0;

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    totalSize += await this.getDirectorySize(fullPath);
                } else {
                    const stats = await fs.stat(fullPath);
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not calculate directory size:', error.message);
        }

        return totalSize;
    }

    /**
     * Clean up directory
     */
    async cleanupDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            console.warn('⚠️ Could not clean up directory:', error.message);
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * List available backups
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (file.startsWith('backup_')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);

                    backups.push({
                        name: file,
                        size: this.formatFileSize(stats.size),
                        created: stats.birthtime,
                        path: filePath
                    });
                }
            }

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('❌ Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Delete backup
     */
    async deleteBackup(backupName) {
        try {
            const backupPath = path.join(this.backupDir, backupName);
            await fs.rm(backupPath, { recursive: true, force: true });

            console.log('🗑️ Backup deleted:', backupName);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete backup:', error);
            return false;
        }
    }
}

module.exports = new BackupService();
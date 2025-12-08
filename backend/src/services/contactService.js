const { prisma } = require('../config/database');

class ContactService {
    // Create contact message
    async createMessage(data) {
        const { name, email, subject, message, userId } = data;

        const contactMessage = await prisma.contactMessage.create({
            data: {
                name,
                email,
                subject,
                message,
                userId: userId || null,
                status: 'UNREAD'
            }
        });

        return this.formatMessage(contactMessage);
    }

    // Get all messages (admin only)
    async getAllMessages(filters = {}) {
        const { page = 1, limit = 20, status } = filters;

        const where = {};
        if (status) where.status = status;

        const [messages, totalCount] = await Promise.all([
            prisma.contactMessage.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.contactMessage.count({ where })
        ]);

        return {
            messages: messages.map(m => this.formatMessage(m)),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    // Get message by ID
    async getMessageById(id) {
        const message = await prisma.contactMessage.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!message) return null;

        // Mark as read if unread
        if (message.status === 'UNREAD') {
            await prisma.contactMessage.update({
                where: { id },
                data: { status: 'READ' }
            });
            message.status = 'READ';
        }

        return this.formatMessage(message);
    }

    // Update message status
    async updateMessageStatus(id, status, adminNotes = null) {
        const updateData = { status };

        if (status === 'RESPONDED') {
            updateData.respondedAt = new Date();
        }

        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        const message = await prisma.contactMessage.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return this.formatMessage(message);
    }

    // Delete message
    async deleteMessage(id) {
        await prisma.contactMessage.delete({
            where: { id }
        });
    }

    // Get unread count
    async getUnreadCount() {
        return await prisma.contactMessage.count({
            where: { status: 'UNREAD' }
        });
    }

    // Format message response
    formatMessage(message) {
        return {
            id: message.id,
            name: message.name,
            email: message.email,
            subject: message.subject,
            message: message.message,
            status: message.status,
            userId: message.userId,
            user: message.user || null,
            adminNotes: message.adminNotes,
            respondedAt: message.respondedAt,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };
    }
}

module.exports = new ContactService();

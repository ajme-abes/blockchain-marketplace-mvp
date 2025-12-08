const { prisma } = require('../config/database');

class TestimonialService {
    // Get published testimonials (public)
    async getPublishedTestimonials(limit = 10) {
        const testimonials = await prisma.testimonial.findMany({
            where: {
                isPublished: true,
                isApproved: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return testimonials.map(t => this.formatTestimonial(t));
    }

    // Get all testimonials (admin only)
    async getAllTestimonials(filters = {}) {
        const { page = 1, limit = 20, isApproved, isPublished } = filters;

        const where = {};
        if (isApproved !== undefined) where.isApproved = isApproved === 'true';
        if (isPublished !== undefined) where.isPublished = isPublished === 'true';

        const [testimonials, totalCount] = await Promise.all([
            prisma.testimonial.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.testimonial.count({ where })
        ]);

        return {
            testimonials: testimonials.map(t => this.formatTestimonial(t)),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    // Create testimonial
    async createTestimonial(data) {
        const { name, role, message, rating = 5, userId } = data;

        const testimonial = await prisma.testimonial.create({
            data: {
                name,
                role: role.toUpperCase(),
                message,
                rating: parseInt(rating),
                userId: userId || null,
                isApproved: false, // Requires admin approval
                isPublished: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return this.formatTestimonial(testimonial);
    }

    // Update testimonial (admin only)
    async updateTestimonial(id, data) {
        const testimonial = await prisma.testimonial.update({
            where: { id },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return this.formatTestimonial(testimonial);
    }

    // Approve testimonial (admin only)
    async approveTestimonial(id) {
        return this.updateTestimonial(id, {
            isApproved: true,
            isPublished: true
        });
    }

    // Reject testimonial (admin only)
    async rejectTestimonial(id) {
        return this.updateTestimonial(id, {
            isApproved: false,
            isPublished: false
        });
    }

    // Delete testimonial
    async deleteTestimonial(id) {
        await prisma.testimonial.delete({
            where: { id }
        });
    }

    // Format testimonial response
    formatTestimonial(testimonial) {
        return {
            id: testimonial.id,
            name: testimonial.user?.name || testimonial.name, // Prefer user's actual name
            role: testimonial.role,
            message: testimonial.message,
            rating: testimonial.rating,
            photo: testimonial.user?.avatarUrl || testimonial.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random&size=150`,
            isApproved: testimonial.isApproved,
            isPublished: testimonial.isPublished,
            userId: testimonial.userId,
            user: testimonial.user ? {
                id: testimonial.user.id,
                name: testimonial.user.name,
                avatarUrl: testimonial.user.avatarUrl
            } : null,
            createdAt: testimonial.createdAt,
            updatedAt: testimonial.updatedAt
        };
    }
}

module.exports = new TestimonialService();

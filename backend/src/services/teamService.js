const { prisma } = require('../config/database');

class TeamService {
    // Get all active team members (public)
    async getActiveTeamMembers() {
        const members = await prisma.teamMember.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                name: true,
                role: true,
                bio: true,
                imageUrl: true,
                email: true,
                linkedin: true,
                twitter: true,
                order: true
            }
        });

        return members;
    }

    // Get all team members (admin only)
    async getAllTeamMembers() {
        const members = await prisma.teamMember.findMany({
            orderBy: { order: 'asc' }
        });

        return members;
    }

    // Get single team member
    async getTeamMember(id) {
        const member = await prisma.teamMember.findUnique({
            where: { id }
        });

        if (!member) {
            throw new Error('Team member not found');
        }

        return member;
    }

    // Create team member (admin only)
    async createTeamMember(data) {
        const { name, role, bio, imageUrl, email, linkedin, twitter, order } = data;

        const member = await prisma.teamMember.create({
            data: {
                name,
                role,
                bio,
                imageUrl,
                email,
                linkedin,
                twitter,
                order: order || 0,
                isActive: true
            }
        });

        return member;
    }

    // Update team member (admin only)
    async updateTeamMember(id, data) {
        const member = await prisma.teamMember.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return member;
    }

    // Delete team member (admin only)
    async deleteTeamMember(id) {
        await prisma.teamMember.delete({
            where: { id }
        });
    }

    // Toggle team member active status (admin only)
    async toggleActiveStatus(id) {
        const member = await this.getTeamMember(id);
        
        const updated = await prisma.teamMember.update({
            where: { id },
            data: { isActive: !member.isActive }
        });

        return updated;
    }

    // Reorder team members (admin only)
    async reorderTeamMembers(orderData) {
        // orderData should be an array of { id, order }
        const updates = orderData.map(({ id, order }) =>
            prisma.teamMember.update({
                where: { id },
                data: { order }
            })
        );

        await prisma.$transaction(updates);
    }
}

module.exports = new TeamService();

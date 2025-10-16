const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(userData) {
    const { email, password, name, phone, role, address } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create main user
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          role,
          address
        }
      });

      // Create role-specific profile
      if (role === 'PRODUCER') {
        await tx.producer.create({
          data: {
            userId: newUser.id,
            businessName: `${name}'s Business`,
            location: address || 'Unknown',
            verificationStatus: 'PENDING'
          }
        });
      } else if (role === 'BUYER') {
        await tx.buyer.create({
          data: {
            userId: newUser.id,
            preferredPaymentMethod: 'chapa'
          }
        });
      }

      return newUser;
    });
    
    // Return user without password
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address,
      registrationDate: user.registrationDate
    };
  }
  
  async findUserByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        registrationDate: true
      }
    });
  }
  
  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        registrationDate: true,
        producerProfile: {
          select: {
            businessName: true,
            location: true,
            verificationStatus: true
          }
        },
        buyerProfile: {
          select: {
            preferredPaymentMethod: true
          }
        }
      }
    });
  }

  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserService();
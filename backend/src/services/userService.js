const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(userData) {
    const { email, password, name, phone, role, address } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role,
        address
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        registrationDate: true
      }
    });
    
    return user;
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
        registrationDate: true
      }
    });
  }
}

module.exports = new UserService();
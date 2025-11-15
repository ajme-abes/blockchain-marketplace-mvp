// backend/src/services/userService.js
const { prisma } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');

class UserService {
  async createUser(userData) {
    try {
      console.log('🔧 createUser called with:', { ...userData, password: '[HIDDEN]' });
      
      const { email, password, name, phone, role, address } = userData;
      
      // Use the new password utility
      const passwordHash = await hashPassword(password);
      
      console.log('🔧 Starting database transaction...');
      
      // Create user transaction
      const user = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside transaction - creating user...');
        
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

        console.log('🔧 User created:', newUser.id);

        // Create role-specific profile
        if (role === 'PRODUCER') {
          console.log('🔧 Creating producer profile...');
          await tx.producer.create({
            data: {
              userId: newUser.id,
              businessName: `${name}'s Business`,
              location: address || 'Unknown',
              verificationStatus: 'PENDING'
            }
          });
        } else if (role === 'BUYER') {
          console.log('🔧 Creating buyer profile...');
          await tx.buyer.create({
            data: {
              userId: newUser.id,
              preferredPaymentMethod: 'chapa'
            }
          });
        }

        return newUser;
      });
      
      console.log('✅ Transaction completed successfully');
      
      // Email verification integration
      let emailResult;
      try {
        console.log('🔧 Loading email verification service...');
        const emailVerificationService = require('./emailVerificationService');
        console.log('✅ Email verification service loaded');
        
        console.log('🔧 Sending verification email...');
        emailResult = await emailVerificationService.sendVerificationEmail(user);
        console.log('🔧 Email service result:', emailResult);
      } catch (emailError) {
        console.warn('⚠️ Email verification service failed:', emailError.message);
        emailResult = {
          success: false,
          error: emailError.message,
          note: 'Email service not available'
        };
      }
      
      // Return user without password
      const response = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        registrationDate: user.registrationDate,
        emailVerified: false,
        verificationEmailSent: emailResult ? emailResult.success : false
      };

      // Add note if email failed
      if (emailResult && !emailResult.success) {
        response.note = emailResult.error || 'Verification email not sent';
      }

      return response;

    } catch (error) {
      console.error('❌ createUser error:', error);
      throw error;
    }
  }

  async createUserWithProfile(userData) {
    try {
      console.log('🔧 createUserWithProfile called with:', { ...userData, password: '[HIDDEN]' });
      
      const { email, password, name, phone, role, address, businessName, location } = userData;
      
      const passwordHash = await hashPassword(password);
      
      console.log('🔧 Starting database transaction for profile creation...');
      
      const user = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside profile transaction - creating user...');
        
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

        console.log('🔧 User created for profile:', newUser.id);

        // Create role-specific profile with custom data
        if (role === 'PRODUCER') {
          console.log('🔧 Creating custom producer profile...');
          await tx.producer.create({
            data: {
              userId: newUser.id,
              businessName: businessName || `${name}'s Business`,
              location: location || address || 'Unknown',
              verificationStatus: 'PENDING'
            }
          });
        } else if (role === 'BUYER') {
          console.log('🔧 Creating buyer profile...');
          await tx.buyer.create({
            data: {
              userId: newUser.id,
              preferredPaymentMethod: 'chapa'
            }
          });
        }

        return newUser;
      });
      
      console.log('✅ Profile transaction completed successfully');
      
      // Email verification integration
      let emailResult;
      try {
        console.log('🔧 Loading email verification service for profile creation...');
        const emailVerificationService = require('./emailVerificationService');
        console.log('✅ Email verification service loaded');
        
        console.log('🔧 Sending verification email...');
        emailResult = await emailVerificationService.sendVerificationEmail(user);
        console.log('🔧 Email service result:', emailResult);
      } catch (emailError) {
        console.warn('⚠️ Email verification service failed:', emailError.message);
        emailResult = {
          success: false,
          error: emailError.message
        };
      }
      
      // Return user with profile information
      const response = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        registrationDate: user.registrationDate,
        hasProducerProfile: role === 'PRODUCER',
        hasBuyerProfile: role === 'BUYER',
        emailVerified: false,
        verificationEmailSent: emailResult ? emailResult.success : false
      };

      // Add note if email failed
      if (emailResult && !emailResult.success) {
        response.note = emailResult.error || 'Verification email not sent';
      }

      return response;

    } catch (error) {
      console.error('❌ createUserWithProfile error:', error);
      throw error;
    }
  }
  
  async findUserByEmail(email) {
    try {
      console.log('🔧 findUserByEmail called for:', email);
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
          registrationDate: true,
          emailVerified: true, // ADD THIS
          producerProfile: {
            select: {
              id: true,
              businessName: true,
              verificationStatus: true
            }
          },
          buyerProfile: {
            select: {
              id: true,
              preferredPaymentMethod: true
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ findUserByEmail error:', error);
      throw error;
    }
  }
  
  // In your backend userService - UPDATE getUserById
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          address: true,
          avatarUrl: true, // ← ADD THIS
          region: true,    // ← ADD THIS
          bio: true,       // ← ADD THIS
          languagePreference: true,
          registrationDate: true,
          emailVerified: true,
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
  
      console.log('🔧 getUserById result:', {
        id: user?.id,
        hasAvatar: !!user?.avatarUrl,
        avatarUrl: user?.avatarUrl
      });
  
      return user;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  }

  async validatePassword(plainPassword, hashedPassword) {
    try {
      return await verifyPassword(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ validatePassword error:', error);
      throw error;
    }
  }

  async getUserForAuth(email) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          producerProfile: true,
          buyerProfile: true
        }
      });
    } catch (error) {
      console.error('❌ getUserForAuth error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const { name, phone, address, languagePreference } = updateData;
      
      return await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone,
          address,
          languagePreference
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          address: true,
          languagePreference: true,
          registrationDate: true,
          emailVerified: true // ADD THIS
        }
      });
    } catch (error) {
      console.error('❌ updateUserProfile error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
// backend/src/services/userService.js
const { prisma } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');

class UserService {
  // In backend/src/services/userService.js - UPDATE createUser method

  async createUser(userData) {
    try {
      console.log('🔧 createUser called with:', { ...userData, password: '[HIDDEN]' });
      
      const { email, password, name, phone, role, address } = userData;
      
      // ✅ FIX: Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔧 Normalized email:', { original: email, normalized: normalizedEmail });
      
      // ✅ ENHANCED VALIDATION: Check for duplicate email (case-insensitive)
      console.log('🔧 Checking for existing users...');
      
      // Check if email already exists (case-insensitive)
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive' // Case-insensitive search
          }
        }
      });
      
      if (existingEmailUser) {
        console.log('❌ Email already exists:', normalizedEmail);
        throw new Error('EMAIL_EXISTS');
      }
      
      // Check if phone already exists (if phone provided)
      if (phone) {
        const existingPhoneUser = await prisma.user.findUnique({
          where: { phone }
        });
        
        if (existingPhoneUser) {
          console.log('❌ Phone number already exists:', phone);
          throw new Error('PHONE_EXISTS');
        }
      }
      
      // Use the new password utility
      const passwordHash = await hashPassword(password);
      
      console.log('🔧 Starting database transaction...');
      
      // Create user transaction
      const user = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside transaction - creating user...');
        
        // ✅ FIX: Store normalized email in database
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail, // Store lowercase
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
      
      // Return user without password (return original email for display)
      const response = {
        id: user.id,
        email: user.email, // This will be normalized (lowercase)
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
      
      // Handle specific errors
      if (error.message === 'EMAIL_EXISTS') {
        throw new Error('User already exists with this email address');
      }
      if (error.message === 'PHONE_EXISTS') {
        throw new Error('User already exists with this phone number');
      }
      
      throw error;
    }
  }

  async createUserWithProfile(userData) {
    try {
      console.log('🔧 createUserWithProfile called with:', { ...userData, password: '[HIDDEN]' });
      
      const { email, password, name, phone, role, address, businessName, location } = userData;
      const normalizedEmail = email.toLowerCase().trim();
    
      // ✅ Check for existing user with normalized email
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          }
        }
      });
      
      if (existingEmailUser) {
        console.log('❌ Email already exists:', normalizedEmail);
        throw new Error('EMAIL_EXISTS');
      }
      
      
      const passwordHash = await hashPassword(password);
      
      console.log('🔧 Starting database transaction for profile creation...');
      
      const user = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside profile transaction - creating user...');
        
        // ✅ FIX: Store normalized email
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
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
      // ✅ FIX: Normalize email for querying
      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔧 findUserByEmail called for:', { original: email, normalized: normalizedEmail });
      
      return await prisma.user.findUnique({
        where: { email: normalizedEmail }, // Query with normalized email
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          phone: true,
          role: true,
          address: true,
          registrationDate: true,
          emailVerified: true,
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
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Password validation error:', error);
      throw error;
    }
  }
  async getUserForAuth(email) {
    try {
      // ✅ FIX: Normalize email for authentication
      const normalizedEmail = email.toLowerCase().trim();
      
      return await prisma.user.findUnique({
        where: { email: normalizedEmail }, // Query with normalized email
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
async hashPassword(password) {
  try {
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('❌ Password hashing error:', error);
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
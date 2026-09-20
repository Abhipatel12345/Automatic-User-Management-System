const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const DEFAULT_ADMIN_EMAIL = 'patilabhay717@gmail.com';
const DEFAULT_ADMIN_PASS = 'Abhay@1234';
const DEFAULT_ADMIN_NAME = 'Abhay Patil';

/**
 * Seed default admin account on server startup if not present
 */
async function seedDefaultAdmin() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN_EMAIL }
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
      await prisma.user.create({
        data: {
          name: DEFAULT_ADMIN_NAME,
          email: DEFAULT_ADMIN_EMAIL,
          password: hashedPassword,
          role: 'ADMIN',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(DEFAULT_ADMIN_NAME)}`
        }
      });
      console.log(`🔐 Default admin seeded: ${DEFAULT_ADMIN_EMAIL}`);
    } else {
      console.log(`🔐 Admin account verified: ${DEFAULT_ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}

/**
 * User Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
}

module.exports = {
  seedDefaultAdmin,
  login,
  getMe,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASS
};

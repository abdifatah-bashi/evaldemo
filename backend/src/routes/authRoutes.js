import express from 'express';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Demo-friendly mock authentication using just email.
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email to login.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please try a demo email.' });
    }

    // Since this is MVP mock auth, we return the user directly (no token)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;

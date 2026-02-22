const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('../models/user.model');
const { HttpError } = require('../utils/http-error');

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new HttpError(400, 'username and password are required');
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      throw new HttpError(401, 'Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new HttpError(401, 'Invalid username or password');
    }

    const token = issueToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(_req, res) {
  res.clearCookie('token');

  return res.json({
    message: 'Logout successful'
  });
}

async function profile(req, res, next) {
  try {
    const userId = req.user?.sub;
    const user = await userModel.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  logout,
  profile
};

import User from '../models/user/user.js'; 
import { v4 as uuidv4 } from 'uuid';
import JWT from 'jsonwebtoken';
import { handleResponse } from '../utils/helper.js';
export const signResetToken = async (email) => {
  const jti = uuidv4();

  await User.findOneAndUpdate(
    { email },
    { password_reset_jti: jti }
  );

  const payload = { email, jti };
  const options = { expiresIn: '5m' };

  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.RESET_TOKEN_SECRET, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};


export const signAccessToken = (id, role) => {
  return generateToken(id, role, process.env.ACCESS_TOKEN_SECRET);
};


export const generateToken = (id, role, secret, expiresIn = process.env.EXPIREIN) => {
  return new Promise((resolve, reject) => {
    const payload = {
      id: id,
      role: role,
    };

    const options = {
      subject: `${id}`,
      expiresIn,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};




export const verifyToken = async (req, res, next) => {

  let token = req.headers.authorization
    ? req.headers.authorization
    : req.headers['x-auth-token'] || req.query.token;


  if (!token) {
    return handleResponse(res, 401, "No token provided");
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {

    const decodedToken = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      return handleResponse(res, 401, "Invalid or expired token");
    }

    req.user = decodedToken;
    next();
  } catch (err) {
    return handleResponse(res, 401, "Invalid or expired token");
  }
};

export const verifyResetToken = async (req, res, next) => {
  let token = req.headers.authorization || req.headers['x-auth-token'] || req.query.token;

  if (!token) return handleResponse(res, 401, "No token provided");

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);

    const user = await User.findOne({ email: decoded.email });

    if (!user || user.password_reset_jti !== decoded.jti) {
      return handleResponse(res, 401, "Invalid or expired token");
    }

    req.user = { email: decoded.email };
    next();
  } catch (err) {
    return handleResponse(res, 401, "Invalid or expired token");
  }
};


export const verifyRole = (req, res) => {
  const { role } = req.user;

  let responseMessage = '';

  if (role === 'ADMIN') {
    responseMessage = 'Admin Login successfully!';
  } else if (role === 'USER') {
    responseMessage = 'User Login successfully!';
  } else {
    return handleResponse(res, 400, "Invalid credentials");
  }

  const { password, password_reset_jti, password_reset_token_expiry, aadhaar_number, pan_number, rera_id_number, operating_since, address, ...safeUser } = req.user.existingUser;

  return handleResponse(res, 200, responseMessage, {
    token: req.user.token,
    role,
    user: safeUser
  });
};


export const isAdmin = async (req, res, next) => {
    try {
        const user = req.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};


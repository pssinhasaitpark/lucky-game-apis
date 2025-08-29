import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    userId: { type: String, unique: true, sparse: true },
    password: String,
    isApproved: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    password_reset_jti: { type: String, default: null },
    wallet: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

export default User;

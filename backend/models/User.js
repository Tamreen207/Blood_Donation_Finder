import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['seeker', 'donor', 'bloodbank', 'admin'];

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
		password: { type: String, required: true, minlength: 6, select: false },
		phone: { type: String, trim: true, default: '' },
		role: { type: String, enum: ROLES, required: true, index: true },
		city: { type: String, trim: true, default: '' },
		isActive: { type: Boolean, default: true },
		isVerified: { type: Boolean, default: false },
		lastLoginAt: { type: Date },
	},
	{ timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
	return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
	const obj = this.toObject();
	delete obj.password;
	delete obj.__v;
	return obj;
};

export const ROLES_LIST = ROLES;
export const User = mongoose.model('User', userSchema);

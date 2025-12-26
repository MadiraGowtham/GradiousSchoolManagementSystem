import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    UserID: { type: String, required: true, unique: true },
    Name: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    UserType: { type: String, enum: ['Teacher', 'Admin', 'Student'], required: true },
    CreatedAt: { type: Date, required: true, default: Date.now },
    UpdatedAt: { type: Date, required: true, default: Date.now },
    AccountStatus: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' }
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('Password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.Password = await bcrypt.hash(this.Password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.Password);
};

const Users = mongoose.model('Users', UserSchema);

export default Users;
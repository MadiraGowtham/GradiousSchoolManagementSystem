import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
    UserID: { type: String, required: true, unique: true, ref: 'Users' },
    REG: { type: String, required: true },
    Address: { type: String, default: '' },
    Phone: { type: String, default: '' },
    Bio: { type: String, default: '' },
    Gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    Age: { type: Number, default: 0 },
    ImageUrl: { type: String, default: './Avatar.png' },
    LastUpdated: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

export default Profile;
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AnnouncementSchema = new Schema({
    Title: { type: String, required: true },
  Description: { type: String, required: true },
    LastUpdated: { type: Date, default: Date.now },
    Visibility: { type: String, enum: ['All', 'Student', 'Class', 'Teacher'], required: true },
    Class: { type: Number },
    CreatedBy: { type: String, ref: 'Users' }
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;
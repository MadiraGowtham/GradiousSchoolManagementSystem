import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ClassSchema = new Schema({
    Class: { type: Number, required: true, unique: true },
  TimeTable: {
    type: Map,
    of: [
      new Schema({
        time: { type: String, required: true },
        subject: { type: String, required: true },
        teacher: { type: String, required: true }
      }, { _id: false })
    ]
    },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now }
});

const Class = mongoose.model('Class', ClassSchema);

export default Class;
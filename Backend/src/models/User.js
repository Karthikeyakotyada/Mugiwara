const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return v.endsWith('@klu.ac.in');
        },
        message: (props) => `${props.value} is not a valid @klu.ac.in institutional email!`
      }
    },
    role: {
      type: String,
      enum: ['STUDENT', 'SUPERVISOR', 'COORDINATOR', 'ADMIN'],
      required: true,
      default: 'STUDENT'
    },
    registerNumber: { type: String, trim: true, uppercase: true },
    department: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ registerNumber: 1 });

module.exports = mongoose.model('User', userSchema);

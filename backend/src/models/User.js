import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
    default: 'student'
  },
  // Teacher-specific fields
  department: {
    type: String,
    required: function() { return this.role === 'teacher'; },
    trim: true
  },
  // Student-specific fields
  studentId: {
    type: String,
    required: function() { return this.role === 'student'; },
    unique: true,
    sparse: true // Allows nulls to be ignored by the unique index
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries on common fields
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model('User', userSchema);
export default User;

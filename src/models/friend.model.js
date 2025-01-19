import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Refers to the User model
      required: true,
    },
    friend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Refers to the User model as a friend
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add an index to make querying faster
friendSchema.index({ user: 1, friend: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;

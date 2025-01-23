import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    friend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastInteractionDate: {
      type: Date,
      default: Date.now, // Initialize with current date
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add an index to ensure unique friend relationships
friendSchema.index({ user: 1, friend: 1 }, { unique: true });

// Virtual field for last interaction (e.g., fetching the latest message)
// friendSchema.virtual('lastInteraction').get(function () {
//   // This is an example placeholder. Implement logic to fetch actual data from another model.
//   // For example, you could query a `Messages` collection here.
//   return null; // Replace with actual logic
// });

// Middleware to prevent self-friendship
friendSchema.pre('save', function (next) {
  if (this.user.equals(this.friend)) {
    const error = new Error("User cannot add themselves as a friend.");
    error.status = 400; // Bad Request
    return next(error);
  }
  next();
});

// Middleware for cascade delete (optional, handle carefully in production)
friendSchema.pre('remove', async function (next) {
  // Example: Remove related data from other collections
  // await Message.deleteMany({ $or: [{ sender: this.user }, { receiver: this.friend }] });
  next();
});

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;

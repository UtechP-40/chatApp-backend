import mongoose, { Schema } from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reciverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message", // Referencing another message in the same collection
      default: null, // Default is null when no reply is made
    },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group",index:true }, 
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

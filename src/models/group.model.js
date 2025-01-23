import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Group name
  description: { type: String }, // Optional group description
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Group admin
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Group = mongoose.model("Group", groupSchema);
export default Group;

import mongoose,{Schema} from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reciverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    image: {
        type: String
    }
},{timestamps: true});

const Message = mongoose.model('Message', messageSchema);

export default Message;
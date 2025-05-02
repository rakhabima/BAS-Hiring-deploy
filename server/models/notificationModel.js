import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const notificationSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    userId: {
        type: String,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ["APPLICATION_STATUS", "INTERVIEW", "TECHNICAL_TEST", "OUTSOURCING_REQUEST", "SYSTEM"],
        required: true
    },
    relatedId: {
        type: String
    },
    relatedModel: {
        type: String,
        enum: ["JobApplication", "InterviewSchedule", "TechnicalTest", "OutsourcingRequest"]
    }
}, {
    timestamps: true
});

notificationSchema.methods.markAsRead = function() {
    this.readStatus = true;
    return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification; 
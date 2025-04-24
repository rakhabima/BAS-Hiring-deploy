import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const outsourcingRequestSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    vendorName: {
        type: String,
        required: true
    },
    contactInfo: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    submission: {
        type: Date,
        default: Date.now
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
        default: "PENDING"
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceId: {
        type: String,
        ref: "OutsourcingService"
    },
    vendorId: {
        type: String,
        ref: "User"
    },
    approvedBy: {
        type: String,
        ref: "User"
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    }
}, {
    timestamps: true
});

const OutsourcingRequest = mongoose.model("OutsourcingRequest", outsourcingRequestSchema);

export default OutsourcingRequest; 
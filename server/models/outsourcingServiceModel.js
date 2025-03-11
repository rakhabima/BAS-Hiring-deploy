import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const outsourcingServiceSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    serviceName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    availabilityStatus: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        ref: "User",
        required: true
    },
    location: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    capacity: {
        type: Number
    },
    price: {
        type: Number
    }
}, {
    timestamps: true
});

const OutsourcingService = mongoose.model("OutsourcingService", outsourcingServiceSchema);

export default OutsourcingService; 
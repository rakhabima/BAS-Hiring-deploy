import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const employeeDataSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    applicationId: {
        type: String,
        ref: "JobApplication"
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"],
        default: "ACTIVE"
    },
    contactInfo: {
        phone: String,
        email: String,
        address: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    documents: [{
        type: {
            type: String,
            enum: ["ID_CARD", "DRIVING_LICENSE", "CERTIFICATE", "OTHER"]
        },
        url: String,
        name: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

employeeDataSchema.methods.updateData = function(updateData) {
    Object.assign(this, updateData);
    return this.save();
};

employeeDataSchema.statics.fetchData = function(filters) {
    return this.find(filters).populate('userId', 'name email');
};

const EmployeeData = mongoose.model("EmployeeData", employeeDataSchema);

export default EmployeeData; 
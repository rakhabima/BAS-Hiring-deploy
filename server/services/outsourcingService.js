import OutsourcingRequest from "../models/outsourcingRequestModel.js";
import OutsourcingServiceModel from "../models/outsourcingServiceModel.js";


export const createOutsourcingService = async (data) => {
    // Anda bisa menambahkan validasi atau logika lainnya di sini
    const newService = new OutsourcingServiceModel(data);
    return newService.save();
};

export const updateOutsourcingService = async (uuid, data) => {
    // Only update services that aren't soft deleted
    const updatedService = await OutsourcingServiceModel.findOneAndUpdate(
        { uuid, isDeleted: false }, 
        data, 
        { new: true }
    );
    return updatedService;
};

export const getAllOutsourcingServices = async () => {
    // Only return services that are not soft deleted
    const outsource = await OutsourcingServiceModel.find({ isDeleted: false });
    return outsource;
};

export const getOutsourcingServiceById = async (uuid) => {
    // Only return the service if it's not soft deleted
    const service = await OutsourcingServiceModel.findOne({ uuid, isDeleted: false });
    return service;
};

export const softDeleteOutsourcingService = async (uuid) => {
    // Perform soft delete by setting isDeleted to true and recording deletion time
    const updatedService = await OutsourcingServiceModel.findOneAndUpdate(
        { uuid },
        { 
            isDeleted: true, 
            deletedAt: new Date() 
        },
        { new: true }
    );
    return updatedService;
};

export const getAllOutsourcingRequests = async () => {
    console.log('Executing getAllOutsourcingRequests service...');
    try {
        const requests = await OutsourcingRequest.find({}).sort({ submission: -1 });
        console.log(`Found ${requests.length} outsourcing requests`);
        return requests;
    } catch (error) {
        console.error('Error in getAllOutsourcingRequests service:', error);
        throw error;
    }
};

export const updateOutsourcingRequestStatus = async (uuid, status) => {
    const request = await OutsourcingRequest.findOneAndUpdate(
        { uuid }, 
        { status },
        { new: true }
    );
    return request;
};

export const deleteOutsourcingRequest = async (uuid) => {
    const request = await OutsourcingRequest.findOneAndDelete({ uuid });
    return request;
};

export const updateOutsourcingRequestData = async (uuid, updateData) => {
    try {
        console.log('Updating outsourcing request data:', uuid, updateData);
        const request = await OutsourcingRequest.findOneAndUpdate(
            { uuid }, 
            updateData,
            { new: true }
        );
        console.log('Updated request:', request);
        return request;
    } catch (error) {
        console.error('Error in updateOutsourcingRequestData service:', error);
        throw error;
    }
};
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
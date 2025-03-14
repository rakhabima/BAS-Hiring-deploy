import OutsourcingServiceModel from "../models/outsourcingServiceModel.js";


export const createOutsourcingService = async (data) => {
    // Anda bisa menambahkan validasi atau logika lainnya di sini
    const newService = new OutsourcingServiceModel(data);
    return newService.save();
};

export const updateOutsourcingService = async (uuid, data) => {
    // Pilih opsi new: true untuk mengembalikan data yang sudah diupdate
    const updatedService = await OutsourcingServiceModel.findOneAndUpdate({ uuid }, data, { new: true });
    return updatedService;
};

export const getAllOutsourcingServices = async () => {
    const outsource = await OutsourcingServiceModel.find();
    return outsource;
};
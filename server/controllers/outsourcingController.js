import { createOutsourcingService, getAllOutsourcingServices, getOutsourcingServiceById, softDeleteOutsourcingService, updateOutsourcingService } from "../services/outsourcingService.js";

export const createOutsourcing = async (req, res) => {
    try {
        // Get data from request body
        const { serviceName, serviceType, description, createdBy, location, capacity, price, availabilityStatus } = req.body;
        
        // Handle file upload if present
        let imageUrl = null;
        if (req.file) {
            // If using multer, the file is available in req.file
            imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Convert string boolean to actual boolean
        const parsedAvailabilityStatus = availabilityStatus === 'true' || availabilityStatus === true;

        // Prepare data for service
        const serviceData = { 
            serviceName, 
            serviceType,
            description, 
            createdBy, 
            location, 
            imageUrl, 
            availabilityStatus: parsedAvailabilityStatus,
            capacity: capacity ? Number(capacity) : undefined, 
            price: price ? Number(price) : undefined 
        };

        // Call service to create outsourcing service
        const savedService = await createOutsourcingService(serviceData);

        // Send success response with saved data
        res.status(201).json({
            message: "Layanan outsourcing berhasil dibuat",
            savedService
        });
    } catch (error) {
        console.error("Error creating outsourcing service:", error);
        // Handle error
        res.status(500).json({
            message: "Terjadi kesalahan saat membuat layanan outsourcing",
            error: error.message
        });
    }
};

export const updateOutsourcing = async (req, res) => {
    try {
        // Get uuid from URL params and update data from body
        const { uuid } = req.params;
        const updateData = { ...req.body };
        
        console.log('Update request received with data:', updateData);
        
        // Handle file upload if present
        if (req.file) {
            updateData.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
        
        // Convert availabilityStatus string to boolean no matter what
        if ('availabilityStatus' in updateData) {
            // Ensure proper conversion to boolean - handle various string representations
            const availabilityValue = updateData.availabilityStatus;
            updateData.availabilityStatus = (
                availabilityValue === true || 
                availabilityValue === 'true' || 
                availabilityValue === 'True' ||
                availabilityValue === '1'
            );
            
            console.log(`Converted availabilityStatus from ${availabilityValue} to ${updateData.availabilityStatus}`);
        }
        
        // Convert numeric fields if present
        if (updateData.capacity) updateData.capacity = Number(updateData.capacity);
        if (updateData.price) updateData.price = Number(updateData.price);

        console.log('Final update data:', updateData);

        // Call service to update
        const updatedService = await updateOutsourcingService(uuid, updateData);

        // If data not found, send 404 response
        if (!updatedService) {
            return res.status(404).json({ message: "Layanan outsourcing tidak ditemukan" });
        }

        // Send success response with updated data
        res.status(200).json({
            message: "Layanan outsourcing berhasil diubah",
            updatedService
        });
    } catch (error) {
        console.error("Error updating outsourcing service:", error);
        // Handle error
        res.status(500).json({
            message: "Terjadi kesalahan saat mengupdate layanan outsourcing",
            error: error.message
        });
    }
};

export const getAllOutsourcing = async (req, res) => {
    try {
        // Call service to get all outsourcing services
        const outsource = await getAllOutsourcingServices();

        // Send success response with data
        res.status(200).json({
            message: "Berhasil mengambil data layanan outsourcing",
            outsource
        });
    } catch (error) {
        console.error("Error getting all outsourcing services:", error);
        // Handle error
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data layanan outsourcing",
            error: error.message
        });
    }
};

export const getOutsourcingById = async (req, res) => {
    try {
        const { uuid } = req.params;
        
        // Call service to get the outsourcing service by ID
        const service = await getOutsourcingServiceById(uuid);
        
        // If service not found or deleted
        if (!service) {
            return res.status(404).json({ message: "Layanan outsourcing tidak ditemukan" });
        }
        
        // Return success response
        res.status(200).json({
            message: "Berhasil mengambil data layanan outsourcing",
            service
        });
    } catch (error) {
        console.error("Error getting outsourcing service:", error);
        // Handle errors
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data layanan outsourcing",
            error: error.message
        });
    }
};

export const deleteOutsourcing = async (req, res) => {
    try {
        const { uuid } = req.params;
        
        // Perform soft delete instead of permanent delete
        const softDeletedService = await softDeleteOutsourcingService(uuid);
        
        // If service not found
        if (!softDeletedService) {
            return res.status(404).json({ message: "Layanan outsourcing tidak ditemukan" });
        }
        
        // Return success response
        res.status(200).json({
            message: "Layanan outsourcing berhasil dihapus",
            deletedService: softDeletedService
        });
    } catch (error) {
        console.error("Error deleting outsourcing service:", error);
        // Handle errors
        res.status(500).json({
            message: "Terjadi kesalahan saat menghapus layanan outsourcing",
            error: error.message
        });
    }
};
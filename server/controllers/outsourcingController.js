import prisma from "../db/prisma.js";
import { createOutsourcingService, deleteOutsourcingRequest as deleteOutsourcingRequestService, getAllOutsourcingRequests as fetchAllOutsourcingRequests, getAllOutsourcingServices, getOutsourcingServiceById, softDeleteOutsourcingService, updateOutsourcingRequestData, updateOutsourcingRequestStatus, updateOutsourcingService, getOutsourcingRequestByIdService } from "../services/outsourcingService.js";
import { sendNotification } from "../utils/notificationService.js";

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

export const getOutsourcingRequestById = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Call service to get the outsourcing service by ID
    const service = await getOutsourcingRequestByIdService(uuid);

    // If service not found or deleted
    if (!service) {
      return res.status(404).json({ message: "Permintaan outsourcing tidak ditemukan" });
    }

    // Return success response
    res.status(200).json({
      message: "Berhasil mengambil data permintaan outsourcing",
      service
    });
  } catch (error) {
    console.error("Error getting outsourcing service:", error);
    // Handle errors
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data permintaan outsourcing",
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

export const createOutsourcingRequest = async (req, res) => {
  try {
    // Extract fields from request body
    const { vendorName, contactInfo, email, location, serviceType, message, quantity = 1 } = req.body;

    // Validate input
    if (!vendorName || !contactInfo || !email || !location || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field harus diisi' 
      });
    }

    // Create outsourcing request in database
    const outsourcingRequest = await prisma.outsourcingRequest.create({
      data: {
        vendorName,
        contactInfo,
        email,
        location,
        message,
        serviceType,
        quantity: parseInt(quantity) || 1,
        submission: new Date(), // Use current date as submission date
        status: "PENDING"
      }
    });

    // Send notification to all General Managers
    try {
      // Find all users with role GENERAL_MANAGER
      const generalManagers = await prisma.user.findMany({ where: { role: "GENERAL_MANAGER", isDeleted: false } });
      
      if (generalManagers && generalManagers.length > 0) {
        // Create notification message with the required details
        const notificationMessage = `Permintaan Outsourcing baru dari ${vendorName} (${email}) untuk layanan ${serviceType}`;
        
        // Send notification to each General Manager
        for (const gm of generalManagers) {
          await sendNotification(
            gm.uuid,
            notificationMessage,
            "OUTSOURCING_REQUEST",
            {
              relatedId: outsourcingRequest.uuid,
              relatedModel: "OutsourcingRequest"
            }
          );
        }
        console.log(`Notifications sent to ${generalManagers.length} General Managers`);
      } else {
        console.log("No General Managers found to notify");
      }
    } catch (notifError) {
      // Log notification error but don't fail the request
      console.error("Error sending notifications:", notifError);
    }

    return res.status(201).json({
      success: true,
      message: 'Permintaan layanan outsourcing berhasil dibuat',
      data: outsourcingRequest
    });
  } catch (error) {
    console.error('Error creating outsourcing request:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat permintaan layanan',
      error: error.message
    });
  }
};

export const getAllOutsourcingRequests = async (req, res) => {
  try {
    // Get all outsourcing requests
    const requests = await fetchAllOutsourcingRequests();
    
    // Log untuk debugging
    console.log('Fetched outsourcing requests:', requests ? requests.length : 0);
    
    return res.status(200).json({
      success: true,
      message: 'Berhasil mendapatkan daftar permintaan outsourcing',
      data: requests
    });
  } catch (error) {
    console.error('Error getting outsourcing requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil permintaan outsourcing',
      error: error.message
    });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Status harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }
    
    // Update the request status
    const updatedRequest = await updateOutsourcingRequestStatus(uuid, status);
    
    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Permintaan outsourcing tidak ditemukan'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Status permintaan outsourcing berhasil diperbarui',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating outsourcing request status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status permintaan outsourcing',
      error: error.message
    });
  }
};

export const handleDeleteOutsourcingRequest = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Delete the request
    const deletedRequest = await deleteOutsourcingRequestService(uuid);
    
    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Permintaan outsourcing tidak ditemukan'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Permintaan outsourcing berhasil dihapus',
      data: deletedRequest
    });
  } catch (error) {
    console.error('Error deleting outsourcing request:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus permintaan outsourcing',
      error: error.message
    });
  }
};

export const updateOutsourcingRequestFullData = async (req, res) => {
  try {
    const { uuid } = req.params;
    const updateData = req.body;
    
    console.log('Received update data for request:', uuid, updateData);
    
    // Update the request
    const updatedRequest = await updateOutsourcingRequestData(uuid, updateData);
    
    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Permintaan outsourcing tidak ditemukan'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Data permintaan outsourcing berhasil diperbarui',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating outsourcing request data:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data permintaan outsourcing',
      error: error.message
    });
  }
};
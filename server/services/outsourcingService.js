import prisma from "../db/prisma.js";

const toDate = (v) => (v === undefined || v === null || v === "" ? undefined : new Date(v));
const toInt = (v) => (v === undefined || v === null || v === "" ? undefined : parseInt(v, 10));

// Whitelist: dulu `data`/`updateData` diteruskan mentah dari req.body.
const SERVICE_FIELDS = ["serviceName", "serviceType", "description", "availabilityStatus", "createdBy", "location", "imageUrl"];
const REQUEST_FIELDS = ["vendorName", "contactInfo", "location", "message", "status", "serviceType", "serviceId", "vendorId", "approvedBy", "email", "phone"];

const pick = (source, fields) => {
    const out = {};
    for (const field of fields) {
        if (source[field] !== undefined) out[field] = source[field];
    }
    return out;
};

export const createOutsourcingService = async (data) => {
    return prisma.outsourcingService.create({
        data: {
            ...pick(data, SERVICE_FIELDS),
            capacity: toInt(data.capacity),
            price: toInt(data.price)
        }
    });
};

export const updateOutsourcingService = async (uuid, data) => {
    // Only update services that aren't soft deleted
    const existing = await prisma.outsourcingService.findFirst({ where: { uuid, isDeleted: false } });
    if (!existing) return null;

    const payload = pick(data, SERVICE_FIELDS);
    if (data.capacity !== undefined) payload.capacity = toInt(data.capacity);
    if (data.price !== undefined) payload.price = toInt(data.price);

    return prisma.outsourcingService.update({ where: { uuid }, data: payload });
};

export const getAllOutsourcingServices = async () => {
    // Only return services that are not soft deleted
    return prisma.outsourcingService.findMany({ where: { isDeleted: false } });
};

export const getOutsourcingServiceById = async (uuid) => {
    // Only return the service if it's not soft deleted
    return prisma.outsourcingService.findFirst({ where: { uuid, isDeleted: false } });
};

export const getOutsourcingRequestByIdService = async (uuid) => {
    return prisma.outsourcingRequest.findUnique({ where: { uuid } });
};

export const softDeleteOutsourcingService = async (uuid) => {
    const existing = await prisma.outsourcingService.findUnique({ where: { uuid } });
    if (!existing) return null;

    return prisma.outsourcingService.update({
        where: { uuid },
        data: { isDeleted: true, deletedAt: new Date() }
    });
};

export const getAllOutsourcingRequests = async () => {
    return prisma.outsourcingRequest.findMany({ orderBy: { submission: "desc" } });
};

export const updateOutsourcingRequestStatus = async (uuid, status) => {
    const existing = await prisma.outsourcingRequest.findUnique({ where: { uuid } });
    if (!existing) return null;

    return prisma.outsourcingRequest.update({ where: { uuid }, data: { status } });
};

export const deleteOutsourcingRequest = async (uuid) => {
    const existing = await prisma.outsourcingRequest.findUnique({ where: { uuid } });
    if (!existing) return null;

    return prisma.outsourcingRequest.delete({ where: { uuid } });
};

export const updateOutsourcingRequestData = async (uuid, updateData) => {
    const existing = await prisma.outsourcingRequest.findUnique({ where: { uuid } });
    if (!existing) return null;

    const payload = pick(updateData, REQUEST_FIELDS);
    if (updateData.quantity !== undefined) payload.quantity = toInt(updateData.quantity);
    if (updateData.submission !== undefined) payload.submission = toDate(updateData.submission);

    return prisma.outsourcingRequest.update({ where: { uuid }, data: payload });
};

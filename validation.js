// validation.js

import { getRequests } from './storage.js';

export const Validation = {
    
    name: (val) => val && val.length >= 3 ? null : "Name must be at least 3 characters",

    email: (val) => {
        if (!val) return "Email is required";
        const emails = val.split(',').map(e => e.trim());
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (let e of emails) {
            if (!emailRegex.test(e)) return `Invalid email format: ${e}`;
        }
        return null;
    },

    phone: (val) => {
        if (!val) return "Phone is required";
        const phones = val.split(',').map(p => p.trim());
        const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/; 
        for (let p of phones) {
            if (!phoneRegex.test(p)) return `Invalid Indian phone number: ${p}`;
        }
        return null;
    },

    orderId: (val, currentRequestId) => {
        if (!val || val.trim() === "") return "Order ID is required";
        
        const requests = getRequests(); 
        const exists = requests.some(req => 
            req.orderId.toLowerCase() === val.trim().toLowerCase() && 
            req.id !== currentRequestId
        );
        
        if (exists) return "This Order ID already exists";
        return null;
    },

    date: (val) => {
        if (!val) return "Date is required";
        const inputDate = new Date(val);
        const today = new Date();
        const minDate = new Date('2000-01-01');
        
        today.setHours(0, 0, 0, 0); 
        
        if (isNaN(inputDate.getTime())) return "Invalid date";
        if (inputDate > today) return "Date cannot be in the future";
        if (inputDate < minDate) return "Date cannot be before year 2000";
        
        return null;
    },

    productName: (val) => val && val.trim() !== "" ? null : "Product Name is required",
    returnReason: (val) => val && val.trim() !== "" ? null : "Return Reason is required",
    amount: (val) => val && parseFloat(val) > 0 ? null : "Amount must be greater than 0",
    status: (val) => val && val.trim() !== "" ? null : "Status is required",

    validateForm: (data) => {
        const errors = {};

        errors.customerName = Validation.name(data.customerName);
        errors.email = Validation.email(data.email);
        errors.phone = Validation.phone(data.phone);
        errors.orderId = Validation.orderId(data.orderId, data.id);
        errors.productName = Validation.productName(data.productName);
        errors.returnReason = Validation.returnReason(data.returnReason);
        errors.requestDate = Validation.date(data.requestDate);
        errors.refundAmount = Validation.amount(data.refundAmount);
        errors.requestStatus = Validation.status(data.requestStatus);

        Object.keys(errors).forEach(key => errors[key] === null && delete errors[key]);
        return errors;
    }
};
// app.js

import { initStorage, getRequests, generateRequestId, saveRequest, deleteRequest } from './storage.js';
import { Validation } from './validation.js';

// -- State Variables --
let deleteTargetId = null;

// -- DOM Elements --
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const requestModal = document.getElementById('requestModal');
const deleteModal = document.getElementById('deleteModal');
const requestForm = document.getElementById('requestForm');
const modalTitle = document.getElementById('modalTitle');

// -- Initialization --
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    renderTable();
    setupEventListeners();
});

// -- Rendering Logic --
function renderTable(searchTerm = '') {
    const requests = getRequests();
    const filteredRequests = requests.filter(req => {
        const term = searchTerm.toLowerCase();
        return Object.values(req).some(val => 
            String(val).toLowerCase().includes(term)
        );
    });

    tableBody.innerHTML = '';

    if (filteredRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" class="p-8 text-center text-slate-500">No requests found.</td></tr>';
        updateSummary(requests); 
        return;
    }

    filteredRequests.forEach(req => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-700/50 transition border-b border-slate-700";
        
        let statusClass = "bg-slate-600 text-slate-200";
        if(req.requestStatus === 'Approved') statusClass = "bg-green-900/50 text-green-300 border border-green-700";
        if(req.requestStatus === 'Rejected') statusClass = "bg-red-900/50 text-red-300 border border-red-700";
        if(req.requestStatus === 'Refunded') statusClass = "bg-yellow-900/50 text-yellow-300 border border-yellow-700";

        // Using data attributes instead of onclick for Event Delegation
        row.innerHTML = `
            <td class="p-4 font-mono text-xs">${req.id}</td>
            <td class="p-4 font-medium text-white">${req.customerName}</td>
            <td class="p-4 truncate max-w-[150px]" title="${req.email}">${req.email}</td>
            <td class="p-4">${req.phone}</td>
            <td class="p-4">${req.orderId}</td>
            <td class="p-4">${req.productName}</td>
            <td class="p-4">${req.returnReason}</td>
            <td class="p-4 whitespace-nowrap">${req.requestDate}</td>
            <td class="p-4 font-bold">₹${parseFloat(req.refundAmount).toFixed(2)}</td>
            <td class="p-4"><span class="px-2 py-1 rounded text-xs font-semibold ${statusClass}">${req.requestStatus}</span></td>
            <td class="p-4">
                <div class="flex gap-2">
                    <button data-action="edit" data-id="${req.id}" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1 rounded text-xs transition border border-indigo-500/30">Edit</button>
                    <button data-action="delete" data-id="${req.id}" class="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1 rounded text-xs transition border border-red-500/30">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSummary(requests);
}

function updateSummary(requests) {
    const total = requests.length;
    const approved = requests.filter(r => r.requestStatus === 'Approved').length;
    const rejected = requests.filter(r => r.requestStatus === 'Rejected').length;
    
    const totalAmount = requests.reduce((sum, r) => {
        if (r.requestStatus === 'Refunded') {
            const val = parseFloat(r.refundAmount);
            return sum + (isNaN(val) ? 0 : val);
        }
        return sum;
    }, 0);

    document.getElementById('summary-total').textContent = total;
    document.getElementById('summary-approved').textContent = approved;
    document.getElementById('summary-rejected').textContent = rejected;
    document.getElementById('summary-amount').textContent = `₹${totalAmount.toFixed(2)}`;
}

// -- Modal Functions (Local Scope Only) --
function openModal() {
    requestForm.reset();
    document.getElementById('requestId').value = ''; 
    modalTitle.textContent = 'Add Return / Refund Request';
    clearValidationErrors();
    requestModal.classList.remove('hidden');
    requestModal.classList.add('flex');
}

function openEditModal(id) {
    const requests = getRequests();
    const req = requests.find(r => r.id === id);
    if (!req) return;

    document.getElementById('requestId').value = req.id;
    document.getElementById('customerName').value = req.customerName;
    document.getElementById('email').value = req.email;
    document.getElementById('phone').value = req.phone;
    document.getElementById('orderId').value = req.orderId;
    document.getElementById('productName').value = req.productName;
    document.getElementById('returnReason').value = req.returnReason;
    document.getElementById('requestDate').value = req.requestDate;
    document.getElementById('refundAmount').value = req.refundAmount;
    document.getElementById('requestStatus').value = req.requestStatus;

    modalTitle.textContent = `Edit Request (${req.id})`;
    clearValidationErrors();
    requestModal.classList.remove('hidden');
    requestModal.classList.add('flex');
}

function closeModal() {
    requestModal.classList.add('hidden');
    requestModal.classList.remove('flex');
}

function promptDelete(id) {
    const requests = getRequests();
    const req = requests.find(r => r.id === id);
    
    deleteTargetId = id;
    const msgEl = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (req.requestStatus === 'Refunded') {
        msgEl.textContent = "Refunded requests cannot be deleted. This request will remain in the list.";
        msgEl.classList.add('text-yellow-400');
        confirmBtn.style.display = 'none'; 
    } else {
        msgEl.textContent = "Are you sure you want to delete this request? This action cannot be undone.";
        msgEl.classList.remove('text-yellow-400');
        confirmBtn.style.display = 'inline-block';
    }

    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
}

function executeDelete() {
    if (deleteTargetId) {
        deleteRequest(deleteTargetId);
        renderTable(searchInput.value);
        closeDeleteModal();
    }
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    deleteModal.classList.remove('flex');
    deleteTargetId = null;
}

// -- Event Listeners Setup --
function setupEventListeners() {
    // 1. Static Button Listeners (Replacing HTML onclicks)
    document.getElementById('addRequestBtn').addEventListener('click', openModal);
    document.getElementById('closeModalIcon').addEventListener('click', closeModal);
    document.getElementById('cancelFormBtn').addEventListener('click', closeModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);

    // 2. Event Delegation for Table Buttons (Edit/Delete)
    tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'edit') openEditModal(id);
        if (action === 'delete') promptDelete(id);
    });

    // 3. Search Bar Listener
    searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    // 4. Form Submit Listener
    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentId = document.getElementById('requestId').value;
        const formData = {
            id: currentId || generateRequestId(),
            customerName: document.getElementById('customerName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            orderId: document.getElementById('orderId').value,
            productName: document.getElementById('productName').value,
            returnReason: document.getElementById('returnReason').value,
            requestDate: document.getElementById('requestDate').value,
            refundAmount: document.getElementById('refundAmount').value,
            requestStatus: document.getElementById('requestStatus').value,
        };

        const errors = Validation.validateForm(formData);
        
        clearValidationErrors();
        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(field => {
                const errorEl = document.getElementById(`error-${field}`);
                if (errorEl) errorEl.textContent = errors[field];
            });
            return; 
        }

        saveRequest(formData);
        renderTable(searchInput.value);
        closeModal();
    });

    // 5. Blur Validation Listener
    const inputs = requestForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const fieldName = input.id;
            const val = input.value;
            const currentId = document.getElementById('requestId').value;
            
            let error = null;
            if (fieldName === 'customerName') error = Validation.name(val);
            if (fieldName === 'email') error = Validation.email(val);
            if (fieldName === 'phone') error = Validation.phone(val);
            if (fieldName === 'orderId') error = Validation.orderId(val, currentId);
            if (fieldName === 'productName') error = Validation.productName(val);
            if (fieldName === 'returnReason') error = Validation.returnReason(val);
            if (fieldName === 'requestDate') error = Validation.date(val);
            if (fieldName === 'refundAmount') error = Validation.amount(val);
            if (fieldName === 'requestStatus') error = Validation.status(val);

            const errorEl = document.getElementById(`error-${fieldName}`);
            if (errorEl) errorEl.textContent = error || "";
        });
    });
}

function clearValidationErrors() {
    const errorSpans = document.querySelectorAll('[id^="error-"]');
    errorSpans.forEach(span => span.textContent = '');
}
// storage.js

const STORAGE_KEY = 'refund_requests_data';

export function initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
}

export function getRequests() {
    initStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

export function generateRequestId() {
    const requests = getRequests();
    if (requests.length === 0) return 'RR-0001';
    
    const maxId = requests.reduce((max, req) => {
        const num = parseInt(req.id.split('-')[1]);
        return num > max ? num : max;
    }, 0);

    const nextId = maxId + 1;
    return `RR-${String(nextId).padStart(4, '0')}`;
}

export function saveRequest(requestData) {
    const requests = getRequests();
    const index = requests.findIndex(r => r.id === requestData.id);
    
    if (index !== -1) {
        requests[index] = requestData;
    } else {
        requests.push(requestData);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function deleteRequest(requestId) {
    let requests = getRequests();
    requests = requests.filter(r => r.id !== requestId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
} 
export interface message {
    id: string;
    content: string;
    role: string;
    createdAt: string;
    accountId: string; // Add this property
}
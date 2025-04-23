export interface message {
    id: string;
    content: string;
    image?: { type: "base64" | "url"; data: string };
    role: "user" | "assistant" | "error";
    accountId: string;
    createdAt: string;
}
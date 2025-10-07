interface PayFastPaymentData {
    merchant_id: string;
    merchant_key: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    name_first: string;
    name_last: string;
    email_address: string;
    cell_number?: string;
    m_payment_id: string;
    amount: string;
    item_name: string;
    item_description?: string;
    custom_int1?: string;
    custom_int2?: string;
    custom_str1?: string;
    custom_str2?: string;
}
interface PayFastWebhookData {
    m_payment_id: string;
    pf_payment_id: string;
    payment_status: 'COMPLETE' | 'FAILED' | 'PENDING';
    item_name: string;
    item_description?: string;
    amount_gross: string;
    amount_fee?: string;
    amount_net?: string;
    custom_str1?: string;
    custom_str2?: string;
    custom_int1?: string;
    custom_int2?: string;
    signature: string;
}
declare class PayFastService {
    private config;
    private baseUrl;
    constructor();
    generatePaymentData(paymentId: string, amount: number, description: string, customerInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    }, customData?: {
        jobId?: string;
        userId?: string;
    }): PayFastPaymentData;
    generateSignature(paymentData: PayFastPaymentData): string;
    validateWebhookSignature(webhookData: PayFastWebhookData): boolean;
    processSuccessfulPayment(webhookData: PayFastWebhookData): Promise<void>;
    createJobPayment(jobId: string, clientId: string, workerId: string, amount: number, description: string): Promise<any>;
    queryPaymentStatus(payfastId: string): Promise<any>;
    processRefund(paymentId: string, amount?: number): Promise<any>;
    getPaymentAnalytics(startDate?: Date, endDate?: Date): Promise<any>;
    private getPaymentsByStatus;
}
declare const _default: PayFastService;
export default _default;
//# sourceMappingURL=payfast.d.ts.map
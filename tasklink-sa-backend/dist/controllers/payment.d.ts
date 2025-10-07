import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}
export declare class PaymentController {
    createJobPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getJobPayments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    releaseEscrowFunds(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refundPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getWalletBalance(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getWalletTransactions(req: AuthRequest, res: Response): Promise<void>;
    requestWithdrawal(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getEarnings(req: AuthRequest, res: Response): Promise<void>;
    getAllPayments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPendingPayments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updatePaymentStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPaymentAnalytics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: PaymentController;
export default _default;
//# sourceMappingURL=payment.d.ts.map
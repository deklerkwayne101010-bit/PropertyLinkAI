import { Request, Response } from 'express';
export declare class WebhookController {
    handlePayFastWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private handleSuccessfulPayment;
    private handleFailedPayment;
    private handlePendingPayment;
    private createPaymentNotifications;
    validatePayFastITN(req: Request, res: Response): Promise<void>;
}
declare const _default: WebhookController;
export default _default;
//# sourceMappingURL=webhook.d.ts.map
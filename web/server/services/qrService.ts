import crypto from 'node:crypto';
import QRCode from 'qrcode';

const QR_SECRET = process.env.AUTH_SECRET || 'campussave_qr_secret_essect_2026';

export async function generateOrderQrCode(orderId: string, commerceId: string): Promise<{
  qrToken: string;
  qrDataUrl: string;
}> {
  const nonce = crypto.randomBytes(4).toString('hex').toUpperCase();
  const payload = `${orderId}:${commerceId}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();

  const qrToken = `CS-${orderId}-${nonce}-${signature}`;
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    width: 260,
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  return { qrToken, qrDataUrl };
}

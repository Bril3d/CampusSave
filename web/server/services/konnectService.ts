import crypto from 'node:crypto';

export interface KonnectInitResult {
  paymentRef: string;
  payUrl: string | null;
  mode: 'konnect_sandbox' | 'local_sandbox_test';
}

export interface KonnectVerifyResult {
  confirmed: boolean;
  mode: 'konnect_sandbox' | 'local_sandbox_test';
  reason?: string;
}

const KONNECT_BASE_URL = process.env.KONNECT_BASE_URL || 'https://api.sandbox.konnect.network/api/v2';

export async function initKonnectPayment(params: {
  orderId: string;
  amountTnd: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  originUrl: string;
}): Promise<KonnectInitResult> {
  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_RECEIVER_WALLET_ID;

  if (apiKey && walletId && !apiKey.startsWith('MY_')) {
    const response = await fetch(`${KONNECT_BASE_URL}/payments/init-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        receiverWalletId: walletId,
        token: 'TND',
        amount: Math.round(params.amountTnd * 1000),
        type: 'immediate',
        description: `Commande CampusSave ${params.orderId}`,
        acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
        lifespan: 15,
        checkoutForm: true,
        addPaymentFeesToAmount: false,
        firstName: params.studentName.split(' ')[0] || 'Etudiant',
        lastName: params.studentName.split(' ').slice(1).join(' ') || 'ESSECT',
        phoneNumber: params.studentPhone || '20000000',
        email: params.studentEmail,
        orderId: params.orderId,
        successUrl: `${params.originUrl}?konnect=success&orderId=${params.orderId}`,
        failUrl: `${params.originUrl}?konnect=fail&orderId=${params.orderId}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erreur Konnect Sandbox: ${text}`);
    }

    const data = (await response.json()) as { paymentRef: string; payUrl: string };
    return {
      paymentRef: data.paymentRef,
      payUrl: data.payUrl,
      mode: 'konnect_sandbox',
    };
  }

  const sandboxRef = `KNX-TEST-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  return {
    paymentRef: sandboxRef,
    payUrl: null,
    mode: 'local_sandbox_test',
  };
}

export async function verifyKonnectPayment(params: {
  paymentRef: string;
  mode: 'konnect_sandbox' | 'local_sandbox_test';
  sandboxConfirmed?: boolean;
}): Promise<KonnectVerifyResult> {
  if (params.mode === 'konnect_sandbox') {
    const apiKey = process.env.KONNECT_API_KEY;
    if (!apiKey) {
      return { confirmed: false, mode: 'konnect_sandbox', reason: 'Clé Konnect manquante côté serveur.' };
    }
    const response = await fetch(`${KONNECT_BASE_URL}/payments/${encodeURIComponent(params.paymentRef)}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    if (!response.ok) {
      return { confirmed: false, mode: 'konnect_sandbox', reason: 'Impossible de vérifier le paiement auprès de Konnect.' };
    }
    const data = (await response.json()) as { payment?: { status?: string } };
    const status = data.payment?.status;
    if (status === 'completed') {
      return { confirmed: true, mode: 'konnect_sandbox' };
    }
    return { confirmed: false, mode: 'konnect_sandbox', reason: `Statut Konnect actuel: ${status || 'pending'}` };
  }

  if (!params.sandboxConfirmed) {
    return {
      confirmed: false,
      mode: 'local_sandbox_test',
      reason: 'Validation de la passerelle de test Konnect requise.',
    };
  }
  return { confirmed: true, mode: 'local_sandbox_test' };
}

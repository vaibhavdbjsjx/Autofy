interface SubscriptionEmailData {
  userEmail: string;
  userName: string;
  businessName: string;
  planName: string;
  planPrice: string;
  planDuration: string;
  startDate: string;
  renewalDate: string;
  paymentMethod: string;
  transactionId: string;
}

export async function sendSubscriptionEmail(data: SubscriptionEmailData) {
  try {
    const response = await fetch('/api/email/subscription-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Email send failed');
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(data: {
  userEmail: string;
  userName: string;
  businessName: string;
}) {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { success: response.ok };
  } catch (error) {
    return { success: false };
  }
}

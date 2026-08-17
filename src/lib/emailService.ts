import { api } from "./api";

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
    const res = await api.post<{ success?: boolean }>("/api/v1/email/subscription-confirmation", data);
    return { success: true, data: res };
  } catch (error) {
    console.error("[EmailService] subscription email error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(data: {
  userEmail: string;
  userName: string;
  businessName: string;
}) {
  try {
    const res = await api.post<{ success?: boolean }>("/api/v1/email/welcome", data);
    return { success: true, data: res };
  } catch (error) {
    console.error("[EmailService] welcome email error:", error);
    return { success: false, error };
  }
}

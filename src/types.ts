// TypeScript Types for Autofy Authentication and Onboarding Flow

export type ViewType = "landing" | "login" | "signup" | "onboarding" | "dashboard";

export interface OnboardingData {
  // Step 1: Business Information
  businessName: string;
  industryType: string;
  phoneNumber: string;
  address: string;
  website: string;

  // Step 2: Business Knowledge
  knowledgeText: {
    services: string;
    pricing: string;
    faqs: string;
    memberships: string;
    policies: string;
  };
  uploadedFiles: Array<{
    name: string;
    size: string;
    type: string;
  }>;

  // Step 3: WhatsApp Setup
  whatsappNumber: string;
  whatsappConnected: "idle" | "connecting" | "connected";

  // Step 4: Payment Setup
  paymentMethod: "upi" | "razorpay" | "phonepe" | null;
  upiId?: string;
  razorpayKey?: string;
  phonepeMerchantId?: string;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  businessName: "",
  industryType: "",
  phoneNumber: "",
  address: "",
  website: "",
  knowledgeText: {
    services: "",
    pricing: "",
    faqs: "",
    memberships: "",
    policies: "",
  },
  uploadedFiles: [],
  whatsappNumber: "",
  whatsappConnected: "idle",
  paymentMethod: null,
  upiId: "",
  razorpayKey: "",
  phonepeMerchantId: "",
};

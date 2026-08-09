export interface PlanConfig {
  id: "monthly" | "yearly" | "pro";
  productName: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  trialDays: number;
  features: string[];
}

export const AUTOFY_PRO_FEATURES = [
  "Unlimited WhatsApp Automation & AI Replies",
  "24/7 Autonomous AI Employee Engine",
  "Instant Live RAG Knowledge Base Indexing",
  "Automated Appointment Booking & Reminders",
  "UPI & Online Payment Links Collection",
  "Lead CRM Capture & Inbox Management",
  "VIP Priority Customer Support",
];

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  monthly: {
    id: "monthly",
    productName: "Autofy Pro",
    name: "Autofy Pro Monthly",
    price: 999,
    currency: "INR",
    interval: "monthly",
    trialDays: 7,
    features: AUTOFY_PRO_FEATURES,
  },
  yearly: {
    id: "yearly",
    productName: "Autofy Pro",
    name: "Autofy Pro Yearly",
    price: 8999,
    currency: "INR",
    interval: "yearly",
    trialDays: 14,
    features: AUTOFY_PRO_FEATURES,
  },
};

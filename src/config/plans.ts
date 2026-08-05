export interface PlanConfig {
  id: "starter" | "pro" | "enterprise";
  name: string;
  normalPrice: number;
  promoFirstCyclePrice: number;
  currency: string;
  interval: string;
  trialDays: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    normalPrice: 999,
    promoFirstCyclePrice: 300,
    currency: "INR",
    interval: "monthly",
    trialDays: 7,
    features: [
      "Up to 1,000 Messages / mo",
      "Standard AI Response Speed",
      "Basic WhatsApp Integration",
      "Manual Lead Export",
      "Email Support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Business Plan",
    normalPrice: 2499,
    promoFirstCyclePrice: 1000,
    currency: "INR",
    interval: "monthly",
    trialDays: 7,
    features: [
      "Unlimited WhatsApp Messages",
      "24/7 Autonomous AI Employee",
      "Instant Live RAG Sync",
      "Auto Appointment & Booking",
      "UPI & Online Payment Links",
      "VIP Priority Support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    normalPrice: 4999,
    promoFirstCyclePrice: 2000,
    currency: "INR",
    interval: "monthly",
    trialDays: 7,
    features: [
      "Everything in Pro +",
      "Custom Fine-tuned LLM Model",
      "Multi-Number WhatsApp Sync",
      "Dedicated Account Manager",
      "99.9% Uptime Guarantee SLA",
    ],
  },
};

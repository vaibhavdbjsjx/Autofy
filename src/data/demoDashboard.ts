export interface DashboardSummaryResponse {
  mode: "live" | "demo";
  business: {
    id: string;
    name: string;
    configured: boolean;
  };
  period: {
    label: string;
    start: string;
    end: string;
  };
  metrics: {
    revenue: number;
    revenue_change_percent: number | null;
    active_leads: number;
    ai_resolution_rate: number | null;
    whatsapp_chats: number;
    appointments: number;
    customer_interactions: number;
    escalations: number | null;
  };
  revenue_series: Array<{ label: string; value: number }>;
  recent_conversations: Array<{
    id: string;
    name: string;
    phone: string;
    lastMessage: string;
    time: string;
    status: "Replied" | "Waiting" | "Escalated";
    unread: boolean;
    channel: string;
    ai_enabled: boolean;
    history: Array<{ sender: "user" | "bot"; text: string; time: string }>;
  }>;
  recent_activity: Array<{
    id: string;
    title: string;
    subtitle: string;
    time: string;
    type: "chat" | "lead" | "appointment" | "payment" | "order" | "ai";
  }>;
}

export const DEMO_DASHBOARD_DATA: DashboardSummaryResponse = {
  mode: "demo",
  business: {
    id: "prod-biz",
    name: "Autofy Workspace",
    configured: false,
  },
  period: {
    label: "This Month",
    start: new Date().toISOString().substring(0, 10),
    end: new Date().toISOString().substring(0, 10),
  },
  metrics: {
    revenue: 0,
    revenue_change_percent: null,
    active_leads: 0,
    ai_resolution_rate: null,
    whatsapp_chats: 0,
    appointments: 0,
    customer_interactions: 0,
    escalations: null,
  },
  revenue_series: [],
  recent_conversations: [],
  recent_activity: [],
};

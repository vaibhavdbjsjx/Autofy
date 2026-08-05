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
    id: "demo-biz-id",
    name: "Autofy Studio (Sample)",
    configured: false,
  },
  period: {
    label: "This Month",
    start: "2026-08-01",
    end: "2026-08-31",
  },
  metrics: {
    revenue: 24965,
    revenue_change_percent: 20,
    active_leads: 4,
    ai_resolution_rate: 99.8,
    whatsapp_chats: 4,
    appointments: 3,
    customer_interactions: 47,
    escalations: 1,
  },
  revenue_series: [
    { label: "1 Jul", value: 4200 },
    { label: "8 Jul", value: 9800 },
    { label: "15 Jul", value: 14500 },
    { label: "22 Jul", value: 19200 },
    { label: "29 Jul", value: 24965 },
  ],
  recent_conversations: [
    {
      id: "demo-c1",
      name: "Priya Patel",
      phone: "+91 98765 01234",
      lastMessage: "Sounds perfect. Scheduled for tomorrow 4:00 PM",
      time: "10:14 AM",
      status: "Replied",
      unread: false,
      channel: "WhatsApp",
      ai_enabled: true,
      history: [
        { sender: "user", text: "Hey! Do you have slots open tomorrow?", time: "10:10 AM" },
        { sender: "bot", text: "Yes Priya! We have slots open at 11:30 AM and 4:00 PM. Would you like to lock tomorrow 4:00 PM?", time: "10:11 AM" },
        { sender: "user", text: "Yes please lock that slot for me.", time: "10:13 AM" },
        { sender: "bot", text: "Fantastic! Your appointment is successfully locked and synced. Looking forward to hosting you!", time: "10:14 AM" },
      ],
    },
    {
      id: "demo-c2",
      name: "Rahul Sharma",
      phone: "+91 91234 56789",
      lastMessage: "Is there any direct UPI pay option available?",
      time: "09:42 AM",
      status: "Waiting",
      unread: true,
      channel: "WhatsApp",
      ai_enabled: true,
      history: [
        { sender: "user", text: "Hello, looking to register for the Premium Membership.", time: "09:40 AM" },
        { sender: "bot", text: "Awesome choice! We support instant enrollment. Our plan is ₹4,999 per quarter.", time: "09:41 AM" },
        { sender: "user", text: "Is there any direct UPI pay option available?", time: "09:42 AM" },
      ],
    },
    {
      id: "demo-c3",
      name: "Amit Verma",
      phone: "+91 85544 32109",
      lastMessage: "Can a human agent escalate my request?",
      time: "Yesterday",
      status: "Escalated",
      unread: false,
      channel: "WhatsApp",
      ai_enabled: false,
      history: [
        { sender: "user", text: "I need to request a complete change structure for my corporate plan.", time: "4:30 PM" },
        { sender: "bot", text: "I can assist you with our list of custom services! What specific packages are you looking to replace?", time: "4:31 PM" },
        { sender: "user", text: "Can a human agent escalate my request?", time: "4:52 PM" },
        { sender: "bot", text: "Understood. I have flagged your chat for urgent manual review. A human manager will ping you on WhatsApp soon.", time: "4:53 PM" },
      ],
    },
    {
      id: "demo-c4",
      name: "Ananya Saxena",
      phone: "+91 74011 22334",
      lastMessage: "Thank you, that answers all my queries!",
      time: "Yesterday",
      status: "Replied",
      unread: false,
      channel: "WhatsApp",
      ai_enabled: true,
      history: [
        { sender: "user", text: "Where can I park my vehicle?", time: "11:10 AM" },
        { sender: "bot", text: "We have dedicated, free basement parking for all our clients. Just tell the gate operator you are visiting our office!", time: "11:12 AM" },
        { sender: "user", text: "Thank you, that answers all my queries!", time: "11:15 AM" },
      ],
    },
  ],
  recent_activity: [
    {
      id: "act-1",
      title: "Appointment Booked",
      subtitle: "Priya Patel confirmed for 4:00 PM session",
      time: "10:14 AM",
      type: "appointment",
    },
    {
      id: "act-2",
      title: "Inbound Inquiry",
      subtitle: "Rahul Sharma asked about UPI payment option",
      time: "09:42 AM",
      type: "chat",
    },
    {
      id: "act-3",
      title: "Human Escalation Flag",
      subtitle: "Amit Verma requested human manager review",
      time: "Yesterday",
      type: "ai",
    },
    {
      id: "act-4",
      title: "Lead Qualified",
      subtitle: "Ananya Saxena scored 85/100 interest benchmark",
      time: "Yesterday",
      type: "lead",
    },
  ],
};

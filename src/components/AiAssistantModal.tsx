import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  Truck,
  RotateCcw,
  Check,
  Copy,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Activity,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  Calendar,
  PhoneCall,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import {
  ERPDataStore,
  AiResponse,
  AiDailySummary,
  BusinessFAQ,
  AiActionButton,
} from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: ERPDataStore | null;
  onRefreshData?: () => void;
  onNavigateToSection?: (section: any, targetId?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  aiResponse?: AiResponse;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  data,
  onRefreshData,
  onNavigateToSection,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'faqs' | 'pulse'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste! Main aapka FreshERP AI Assistant hoon. Mere paas aapke authorized ERP records ka live access hai — jaise Customer Khata, Aaj ki Sales, Fruit Stock, Mandi Expenses, aur Wastage.

Aap mujhse seedhe Hinglish ya English mein pooch sakte hain, jaise:
• "Sharma Fruits ka khata batao"
• "Kitna paisa lena hai?"
• "Kin customers ko follow up karna hai?"
• "Apple ka stock kam hai kya?"
• "Aaj ka profit kitna hai?"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);

  // FAQs and Daily Summary states
  const [faqs, setFaqs] = useState<BusinessFAQ[]>([]);
  const [faqCategory, setFaqCategory] = useState<string>('All');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const [dailySummary, setDailySummary] = useState<AiDailySummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  // Load FAQs and Daily Summary when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFaqs();
      loadDailySummary();
    }
  }, [isOpen]);

  const loadFaqs = async () => {
    try {
      const res = await api.getBusinessFAQs();
      if (res?.faqs) {
        setFaqs(res.faqs);
      }
    } catch (e) {
      console.error('Failed to load FAQs:', e);
    }
  };

  const loadDailySummary = async () => {
    setIsSummaryLoading(true);
    try {
      const summary = await api.getAISummary();
      if (summary) {
        setDailySummary(summary);
      }
    } catch (e) {
      console.error('Failed to load daily summary:', e);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const quickQuestions = [
    { label: 'Sharma Fruits Khata', q: 'Sharma Fruits ka khata batao' },
    { label: 'Kitna lena hai?', q: 'Kitna paisa customer se lena hai?' },
    { label: 'Payment Follow-up', q: 'Kin customers ko follow up karna hai?' },
    { label: 'Apple Stock Level', q: 'Apple ka stock kam hai kya?' },
    { label: "Today's Profit", q: 'Aaj ka profit kitna hai?' },
    { label: 'Wastage Report', q: 'Kaunsa fruit zyada kharab ho raha hai?' },
    { label: 'Supplier Payables', q: 'Kise payment dena hai?' },
    { label: 'Orange Stock Coverage', q: 'Orange ka stock kitne din chalega?' },
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    if (activeTab !== 'chat') setActiveTab('chat');

    try {
      const res: AiResponse = await api.askAI(query);
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiResponse: res,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: isOffline
          ? `[Offline Mode Active] The AI Assistant requires an active internet connection to query the Gemini cloud service. All your local ERP operations (billing, sales, customer khata, supplier ledgers, inventory, reports) remain 100% operational offline.`
          : `AI Assistant is temporarily unavailable (${err.message || 'Offline or invalid API key'}). Your core offline ERP functions remain fully active and unaffected.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (act: AiActionButton, msgId: string) => {
    if (act.action === 'whatsapp') {
      const phone = act.data?.phone ? act.data.phone.replace(/[^0-9]/g, '') : '';
      const customerName = act.data?.customerName || 'Customer';
      const amount = act.data?.amount ? `₹${Math.round(act.data.amount).toLocaleString('en-IN')}` : 'outstanding';
      const text = `Namaste ${customerName} ji, FreshERP record ke mutabik aapka pending amount ${amount} hai. Kripya payment update kar dijiye. Dhanyawad!`;

      // Copy text to clipboard
      navigator.clipboard?.writeText(text);
      setCopiedActionId(`${msgId}-${act.label}`);
      setTimeout(() => setCopiedActionId(null), 3500);

      // Open WhatsApp web or app
      const waUrl = phone
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (act.action === 'view_khata' || act.action === 'view_customer') {
      if (onNavigateToSection) {
        onNavigateToSection('customers', act.targetId);
        onClose();
      }
      return;
    }

    if (act.action === 'view_stock') {
      if (onNavigateToSection) {
        onNavigateToSection('fruits', act.targetId);
        onClose();
      }
      return;
    }

    if (act.action === 'create_purchase') {
      if (onNavigateToSection) {
        onNavigateToSection('purchases');
        onClose();
      }
      return;
    }

    if (act.action === 'view_report') {
      if (onNavigateToSection) {
        onNavigateToSection('reports');
        onClose();
      }
      return;
    }

    if (act.action === 'view_supplier') {
      if (onNavigateToSection) {
        onNavigateToSection('suppliers', act.targetId);
        onClose();
      }
      return;
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = faqCategory === 'All' || faq.category === faqCategory;
    const matchesSearch =
      !faqSearch ||
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      (faq.questionHinglish && faq.questionHinglish.toLowerCase().includes(faqSearch.toLowerCase())) ||
      faq.shortAnswer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqCategories = ['All', 'Khata', 'Sales', 'Stock', 'Profit', 'Purchase', 'Operations'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full h-full sm:h-[680px] sm:max-w-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight font-heading text-white">
                  FreshERP AI Assistant
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live ERP DB
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 font-medium">
                Ask anything about your business
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1 py-1.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chat Q&A</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'faqs'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Business FAQs</span>
            </button>

            <button
              onClick={() => setActiveTab('pulse')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'pulse'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>Daily Pulse</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strictly Verified ERP Data</span>
          </div>
        </div>

        {/* ================= TAB 1: CHAT Q&A ================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                const aiData = m.aiResponse;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {/* AI Header Tag (if category present) */}
                      {!isUser && aiData?.category && (
                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/60">
                            {aiData.category}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {m.timestamp}
                          </span>
                        </div>
                      )}

                      {/* Main Answer Text */}
                      <div className="whitespace-pre-line text-slate-800 font-normal">
                        {m.text}
                      </div>

                      {/* Render Key Metrics (if available) */}
                      {!isUser && aiData?.keyMetrics && aiData.keyMetrics.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {aiData.keyMetrics.map((km, kIdx) => (
                            <div
                              key={kIdx}
                              className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 flex flex-col"
                            >
                              <span className="text-[10px] font-semibold text-slate-500 truncate">
                                {km.label}
                              </span>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-sm font-bold text-slate-900 font-heading">
                                  {km.value}
                                </span>
                              </div>
                              {km.badge && (
                                <span className="mt-1 text-[9px] font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded w-fit">
                                  {km.badge}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Structured Data (e.g. Khata Ledger Entries) */}
                      {!isUser && aiData?.structuredData?.type === 'customer_khata' && aiData.structuredData.items && (
                        <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-between">
                            <span>Recent Khata Entries</span>
                            <span>Date & Balance</span>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                            {aiData.structuredData.items.map((entry: any, eIdx: number) => (
                              <div key={eIdx} className="px-3 py-2 text-[11px] flex items-center justify-between gap-2">
                                <div>
                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        entry.type === 'Payment' ? 'bg-emerald-500' : 'bg-blue-500'
                                      }`}
                                    />
                                    <span>{entry.type}</span>
                                    <span className="text-slate-400 font-normal">({entry.date})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">{entry.description || entry.referenceNo || 'Transaction'}</p>
                                </div>
                                <div className="text-right">
                                  <div
                                    className={`font-bold ${
                                      entry.type === 'Payment' ? 'text-emerald-700' : 'text-slate-800'
                                    }`}
                                  >
                                    {entry.credit > 0 ? `- ₹${entry.credit.toLocaleString('en-IN')}` : `+ ₹${entry.debit.toLocaleString('en-IN')}`}
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    Bal: ₹{(entry.balance || 0).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Render Recommendation (if present) */}
                      {!isUser && aiData?.recommendation && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2 text-amber-900 text-[11px]">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <span className="font-bold">Business Tip: </span>
                            {aiData.recommendation}
                          </div>
                        </div>
                      )}

                      {/* Render Action Buttons (WhatsApp, View Khata, etc.) */}
                      {!isUser && aiData?.actions && aiData.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                          {aiData.actions.map((act, aIdx) => {
                            const isWhatsApp = act.action === 'whatsapp';
                            const isCopied = copiedActionId === `${m.id}-${act.label}`;

                            return (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(act, m.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer ${
                                  isWhatsApp
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                                }`}
                              >
                                {isWhatsApp ? (
                                  isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  ) : (
                                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                                  )
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                                )}
                                <span>{isCopied ? 'Reminder Copied!' : act.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2.5 text-xs text-emerald-800 bg-white border border-emerald-200/80 px-4 py-2.5 rounded-2xl w-fit shadow-xs">
                  <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                  <span className="font-semibold">Searching authorized database records...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 bg-white border-t border-slate-200/70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Quick Business Questions:
                </span>
                <span className="text-[10px] text-slate-400">Click to ask instantly</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSend(q.q)}
                    className="shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <label htmlFor="ai-assistant-chat-input" className="sr-only">Ask AI Assistant</label>
              <input
                id="ai-assistant-chat-input"
                aria-label="Ask AI Assistant a question"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business (e.g., Sharma Fruits ka khata, kitna lena hai)..."
                disabled={isLoading}
                className="flex-1 bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BUSINESS FAQS ================= */}
        {activeTab === 'faqs' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-hidden">
            {/* Search and Category Filter */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="relative">
                <label htmlFor="ai-assistant-faq-search" className="sr-only">Search FAQs</label>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="ai-assistant-faq-search"
                  aria-label="Search FAQs"
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search FAQs (Khata, Mandi, Hamali, Billing, Stock)..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {faqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFaqCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      faqCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQs List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No FAQs found matching your search.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0 mt-0.5 border border-emerald-200/60">
                            {faq.category}
                          </span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">
                              {faq.question}
                            </h4>
                            {faq.questionHinglish && (
                              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                {faq.questionHinglish}
                              </p>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs space-y-3">
                          <div>
                            <span className="font-bold text-slate-800 text-[11px]">Quick Answer: </span>
                            <span className="text-slate-700">{faq.shortAnswer}</span>
                          </div>

                          {faq.steps && faq.steps.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-800 text-[11px] block mb-1">
                                Step-by-Step Guide:
                              </span>
                              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                                {faq.steps.map((st, sIdx) => (
                                  <li key={sIdx}>{st}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400">
                              Query: "{faq.sampleQuery}"
                            </span>
                            <button
                              onClick={() => handleSend(faq.sampleQuery)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Ask AI with Live Data</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DAILY PULSE ================= */}
        {activeTab === 'pulse' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 p-4 sm:p-5 overflow-y-auto">
            {isSummaryLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                <span>Generating real-time business pulse...</span>
              </div>
            ) : dailySummary ? (
              <div className="space-y-4 max-w-xl mx-auto w-full">
                {/* Greeting & Headline */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                      {dailySummary.date}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 font-heading mt-2">
                      {dailySummary.greeting}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {dailySummary.headline}
                    </p>
                  </div>
                  <button
                    onClick={loadDailySummary}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Refresh Pulse"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* KPI Pulse Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500">Today Sales</span>
                    <p className="text-base font-bold text-slate-900 font-heading mt-0.5">
                      ₹{dailySummary.sales.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500">Purchases</span>
                    <p className="text-base font-bold text-slate-900 font-heading mt-0.5">
                      ₹{dailySummary.purchase.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500">Expenses</span>
                    <p className="text-base font-bold text-slate-900 font-heading mt-0.5">
                      ₹{dailySummary.expenses.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-semibold text-emerald-700">Est. Profit</span>
                    <p className="text-base font-bold text-emerald-700 font-heading mt-0.5">
                      ₹{dailySummary.estimatedProfit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Attention Points */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Action Items for Owner</span>
                  </h4>

                  <div className="divide-y divide-slate-100">
                    {dailySummary.attentionPoints.map((item) => (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {item.text}
                        </p>
                        {item.actionLabel && (
                          <button
                            onClick={() => {
                              if (item.action === 'whatsapp') {
                                handleSend('Kin customers ko follow up karna hai?');
                              } else if (item.action === 'view_stock') {
                                handleSend('Apple ka stock kam hai kya?');
                              }
                            }}
                            className="shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            {item.actionLabel}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Owner Recommendation */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Strategy Tip: </span>
                    {dailySummary.suggestion}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Summary currently unavailable.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

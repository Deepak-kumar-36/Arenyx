"use client";
import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { Sparkles, X, Send, Loader2, Paperclip, MapPin } from "lucide-react";

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "ai"; hasMap?: boolean }[]>([
    { text: "Welcome to Arenyx, Alex! How can I help you navigate the stadium today?", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("server_chat", (payload: any) => {
      setMessages((prev) => [...prev, { text: payload.text, sender: "ai" }]);
      setIsLoading(false);
    });

    return () => {
      socket.off("server_chat");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const commitSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { text: text, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    if (!socket.connected) {
      // Not connected — show a helpful offline message immediately
      setMessages((prev) => [...prev, {
        text: "I'm offline right now — check the Gates and Heatmap tabs for live crowd data!",
        sender: "ai"
      }]);
      setIsLoading(false);
      return;
    }

    socket.emit("client_chat", text);

    // Safety timeout: if server takes > 12s, show a fallback
    const timer = setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) {
          setMessages((prev) => [...prev, {
            text: "Taking longer than usual — please check the Heatmap tab for live gate and concession data!",
            sender: "ai"
          }]);
        }
        return false;
      });
    }, 12000);

    // Clear timer when the real response arrives (handled in useEffect via socket.on)
    socket.once("server_chat", () => clearTimeout(timer));
  };

  const handleSend = () => {
    commitSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[650px] mb-4 bg-[#262626]/60 backdrop-blur-[20px] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_40px_-10px_rgba(157,78,221,0.25)] origin-bottom-right transition-all animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <header className="bg-zinc-900/60 backdrop-blur-xl flex justify-between items-center px-6 py-5 w-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-[#d095ff]/20 rounded-full">
                <Sparkles className="text-[#d095ff] h-5 w-5" />
              </div>
              <div>
                <h1 className="text-white tracking-[0.05em] uppercase font-bold text-lg leading-tight">Arenyx Guide</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-[#adaaaa] uppercase tracking-widest font-semibold">Live Operator</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-95 duration-200">
                <X className="text-[#adaaaa] h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <section className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>
                <div className={`${
                    msg.sender === "user" 
                    ? "bg-[#d095ff]/20 border border-[#d095ff]/20 rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-2xl p-4 text-[#e3c6ff]" 
                    : "bg-[#1a1919] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 text-white"
                }`}>
                  <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.hasMap && (
                     <div className="mt-4 rounded-xl overflow-hidden h-32 relative group border border-white/5">
                        <img className="w-full h-full object-cover" alt="Stadium Map" src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80&w=600" />
                        <div className="absolute inset-0 bg-[#d095ff]/30 mix-blend-overlay"></div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d095ff] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d095ff]"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d095ff]">Fastest Route Active</span>
                            </div>
                        </div>
                     </div>
                  )}

                </div>
                <span className="text-[10px] text-[#adaaaa] uppercase tracking-widest px-1">
                    {msg.sender === "user" ? "You" : "Arenyx AI"}
                </span>
              </div>
            ))}
            {isLoading && (
               <div className="flex flex-col gap-1 max-w-[85%] self-start items-start">
                    <div className="bg-[#1a1919] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 text-white flex items-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin text-[#d095ff]" />
                         <span className="text-xs font-bold text-[#adaaaa]">Thinking...</span>
                    </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </section>

          {/* Interaction Drawer */}
          <footer className="p-5 space-y-4 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/90 to-transparent shrink-0">
            {/* Suggestion Chips */}
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
              {["Nearest Restroom", "F&B Options", "Gate Wait Times", "Exit Route"].map((chip) => (
                  <button 
                    key={chip}
                    onClick={() => commitSend(chip)}
                    className="whitespace-nowrap px-4 py-2 bg-[#201f1f] text-white text-xs font-semibold rounded-full border border-white/5 hover:bg-[#2c2c2c] transition-all active:scale-95">
                      {chip}
                  </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#262626] rounded-full pl-4 pr-2 py-2 flex items-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <Paperclip className="h-4 w-4 text-[#adaaaa] shrink-0 ml-1" />
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your request..." 
                  className="bg-transparent border-none focus:ring-0 outline-none text-sm text-white placeholder:text-[#adaaaa] w-full px-2" 
                />
              </div>
              <button 
                 onClick={handleSend}
                 disabled={!input.trim() || isLoading}
                 className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#d095ff] to-[#c782ff] text-[#38005e] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(208,149,255,0.4)] active:scale-90 transition-all duration-300 disabled:opacity-50 disabled:shadow-none">
                <Send className="h-5 w-5 ml-1" />
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 bg-gradient-to-br from-[#9D4EDD] to-[#3C096C] text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(157,78,221,0.4)] transition-all hover:scale-105 active:scale-95 group animate-in slide-in-from-bottom border border-white/10"
        >
          <Sparkles className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute top-0 right-0 h-4 w-4 bg-[#ff6e84] border-2 border-[#0e0e0e] rounded-full animate-pulse" />
        </button>
      )}
    </div>
  );
};

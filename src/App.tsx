import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Newspaper, 
  Lightbulb, 
  BarChart3, 
  Menu, 
  Plus, 
  History, 
  Settings, 
  X,
  Download,
  Maximize2,
  Volume2,
  VolumeX,
  Loader2,
  Crown,
  LogOut,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from './services/geminiService';
import { cn, Message, LIMITS } from './utils';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Ad } from './components/Ads';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const { user, firebaseUser, usage, loading, logout, upgrade, incrementUsage, checkLimit } = useAuth();
  const [view, setView] = useState<'home' | 'chat' | 'image' | 'news' | 'analysis'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('velix_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('velix_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <p className="text-white/50 text-sm animate-pulse uppercase tracking-widest">Initializing Velix AI...</p>
      </div>
    );
  }

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `velix-ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (firebaseUser && !firebaseUser.emailVerified) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!checkLimit('chats')) {
      setShowInterstitial(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setView('chat');
    setIsStreaming(true);
    incrementUsage('chats');

    try {
      const stream = await geminiService.generateChatResponse([...messages, userMsg]);
      
      let modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, modelMsg]);

      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'model') {
              return [...prev.slice(0, -1), { ...last, content: fullContent }];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const startVoiceInput = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  const handleTTS = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const url = await geminiService.textToSpeech(text);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    }
  };

  const generateImage = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (firebaseUser && !firebaseUser.emailVerified) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!checkLimit('images')) {
      setShowInterstitial(true);
      return;
    }
    if (!input.trim()) return;
    setIsGeneratingImage(true);
    setView('image');
    incrementUsage('images');
    try {
      const url = await geminiService.generateImage(input);
      setGeneratedImage(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (firebaseUser && !firebaseUser.emailVerified) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!checkLimit('analysis')) {
      setShowInterstitial(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsAnalyzing(true);
      setView('analysis');
      incrementUsage('analysis');
      try {
        const result = await geminiService.analyzeData(content);
        setAnalysisResult(result || "No analysis generated.");
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };

  const fetchNews = () => {
    setView('news');
    // Placeholder news
    setNews([
      { id: 1, title: "Gemini 3.1 Released", desc: "Google announces the latest iteration of its powerful AI model with enhanced reasoning.", image: "https://picsum.photos/seed/ai1/400/200" },
      { id: 2, title: "The Future of Robotics", desc: "How AI is transforming physical automation in the workplace.", image: "https://picsum.photos/seed/robot/400/200" },
      { id: 3, title: "AI in Healthcare", desc: "New breakthroughs in diagnostic accuracy using deep learning models.", image: "https://picsum.photos/seed/health/400/200" },
    ]);
  };

  const handleUpgrade = async () => {
    setIsPaying(true);
    // Simulate Stripe payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    await upgrade();
    setIsPaying(false);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  Velix AI
                </h2>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6 text-white/50" />
                </button>
              </div>

              {user && (
                <div className="mb-8 p-4 glass-card bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{user.name}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest">{user.plan} PLAN</div>
                    </div>
                  </div>
                  {user.plan === 'free' && (
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      GO PREMIUM
                    </button>
                  )}
                </div>
              )}

              <button 
                onClick={() => { setView('home'); setMessages([]); setIsSidebarOpen(false); }}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-4"
              >
                <Plus className="w-5 h-5 text-brand-primary" />
                <span>New Chat</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-2">Recent</div>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/70">
                  <History className="w-4 h-4" />
                  <span className="truncate">AI Strategy Discussion</span>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/70">
                  <History className="w-4 h-4" />
                  <span className="truncate">Data Analysis Project</span>
                </button>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-widest text-center mb-2">
                  Made with ❤️ by Ali
                </div>
                {user?.isAdmin && (
                  <button 
                    onClick={() => { setIsAdminPanelOpen(true); setIsSidebarOpen(false); }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-brand-primary font-semibold"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </button>
                )}
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/70">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                {user ? (
                  <button 
                    onClick={logout}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => { setIsAuthModalOpen(true); setIsSidebarOpen(false); }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-brand-primary text-black font-bold"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-white/70" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="font-semibold text-sm tracking-wide">VELIX AI</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.plan === 'premium' && <Crown className="w-5 h-5 text-brand-primary" />}
            {!user && (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-bold text-brand-primary"
              >
                SIGN IN
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {user?.plan === 'free' && <Ad type="banner" />}
          
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center"
              >
                <div className="relative mb-12">
                  <div className="glow-orb" />
                  <div className="glow-orb-inner" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md">
                      <div className="w-16 h-16 rounded-full bg-white/10 animate-spin-slow" />
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl font-bold mb-4 tracking-tight">
                  How can I help you <br />
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">today?</span>
                </h1>
                
                <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-8 animate-pulse">
                  Designed & Developed by Ali
                </p>

                {user && user.plan === 'free' && (
                  <div className="mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                    {usage.chats} / {LIMITS.free.chats} Daily Chats Used
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <button onClick={() => setView('image')} className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group relative">
                    {user?.plan === 'free' && usage.images >= LIMITS.free.images && <Lock className="absolute top-2 right-2 w-3 h-3 text-white/20" />}
                    <ImageIcon className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Create Image</span>
                  </button>
                  <button onClick={fetchNews} className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                    <Newspaper className="w-6 h-6 text-brand-secondary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Latest News</span>
                  </button>
                  <button onClick={() => setView('chat')} className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                    <Lightbulb className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Get Advice</span>
                  </button>
                  <label className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group cursor-pointer relative">
                    {user?.plan === 'free' && usage.analysis >= LIMITS.free.analysis && <Lock className="absolute top-2 right-2 w-3 h-3 text-white/20" />}
                    <BarChart3 className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Analyze Data</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.txt" />
                  </label>
                </div>
              </motion.div>
            )}

            {view === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col p-6 space-y-6"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-white/30 text-sm italic">
                    Start a conversation...
                  </div>
                )}
                {messages.map((msg, i) => (
                  <React.Fragment key={msg.id}>
                    <div
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm",
                          msg.role === 'user' 
                            ? "bg-brand-primary/20 border border-brand-primary/30 text-white" 
                            : "bg-white/5 border border-white/10 text-white/90"
                        )}
                      >
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <span className="text-[10px] text-white/30">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.role === 'model' && msg.content && (
                          <button 
                            onClick={() => handleTTS(msg.content)}
                            className="text-white/30 hover:text-brand-primary transition-colors"
                          >
                            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    {user?.plan === 'free' && i > 0 && i % 4 === 0 && <Ad type="banner" />}
                  </React.Fragment>
                ))}
                <div ref={chatEndRef} />
              </motion.div>
            )}

            {view === 'image' && (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 flex flex-col items-center"
              >
                <h2 className="text-xl font-bold mb-6">Image Generation</h2>
                <div className="w-full aspect-square glass-card overflow-hidden flex items-center justify-center relative group">
                  {isGeneratingImage ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                      <span className="text-sm text-white/50">Generating your masterpiece...</span>
                    </div>
                  ) : generatedImage ? (
                    <>
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                      {user?.plan === 'free' && (
                        <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold text-white/40 uppercase tracking-widest">
                          Velix AI Free Watermark
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={downloadImage}
                          className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => setIsFullscreenImage(true)}
                          className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                        >
                          <Maximize2 className="w-6 h-6" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-white/20 flex flex-col items-center gap-3">
                      <ImageIcon className="w-12 h-12" />
                      <span className="text-sm">Enter a prompt below to generate</span>
                    </div>
                  )}
                </div>
                {!isGeneratingImage && !generatedImage && (
                  <div className="mt-8 w-full max-w-md">
                    <p className="text-xs text-white/40 mb-4 text-center">Try: "A futuristic cyberpunk city with neon lights and flying cars"</p>
                    <button 
                      onClick={generateImage}
                      disabled={!input.trim()}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                    >
                      Generate Image
                    </button>
                  </div>
                )}
                {generatedImage && !isGeneratingImage && (
                  <button 
                    onClick={() => { setGeneratedImage(null); setInput(''); }}
                    className="mt-6 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    Generate another
                  </button>
                )}
              </motion.div>
            )}

            {view === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-6"
              >
                <h2 className="text-xl font-bold mb-2">Latest AI News</h2>
                {news.map((item, i) => (
                  <React.Fragment key={item.id}>
                    <div className="glass-card overflow-hidden group">
                      <img src={item.image} alt={item.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="p-4">
                        <h3 className="font-bold mb-2">{item.title}</h3>
                        <p className="text-sm text-white/60 line-clamp-2">{item.desc}</p>
                        <button className="mt-4 text-xs font-bold text-brand-primary flex items-center gap-1">
                          Read More <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {user?.plan === 'free' && i === 0 && <Ad type="banner" />}
                  </React.Fragment>
                ))}
              </motion.div>
            )}

            {view === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6"
              >
                <h2 className="text-xl font-bold mb-6">Data Analysis</h2>
                <div className="glass-card p-6 min-h-[300px]">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <span className="text-sm text-white/50">Analyzing your data...</span>
                    </div>
                  ) : analysisResult ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-white/20">
                      <BarChart3 className="w-12 h-12" />
                      <span className="text-sm">Upload a file to see analysis</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-40">
          <div className="max-w-4xl mx-auto flex items-center gap-3 glass-card p-2 pr-3">
            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 placeholder:text-white/20"
            />
            <div className="flex items-center gap-1">
              <button 
                onClick={startVoiceInput}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "text-white/50 hover:text-white"
                )}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="p-2 bg-brand-primary rounded-full text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFullscreenImage && generatedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
          >
            <button 
              onClick={() => setIsFullscreenImage(false)}
              className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={generatedImage} alt="Fullscreen" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="mt-8 flex gap-4">
              <button 
                onClick={downloadImage}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      {showInterstitial && <Ad type="interstitial" onClose={() => setShowInterstitial(false)} />}

      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card w-full max-w-md p-8 relative z-10 text-center"
            >
              <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 text-white/30">
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="w-8 h-8 text-brand-primary" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
              <p className="text-white/50 text-sm mb-8">
                Unlock unlimited AI chats, high-res image generation, and advanced data analysis for just <span className="text-white font-bold">$9.99/month</span>.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Plan</span>
                    <span className="font-bold">Premium Monthly</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Price</span>
                    <span className="font-bold">$9.99</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-brand-primary">$9.99</span>
                  </div>
                </div>

                <button 
                  onClick={handleUpgrade}
                  disabled={isPaying}
                  className="w-full py-4 rounded-xl bg-brand-primary text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay with Stripe'}
                </button>
                
                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                  Secure payment powered by Stripe
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} className="hidden" />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

const VOICE_OPTIONS = [
  // American Male Voices
  { id: "am_adam", label: "Adam (Deep & Grounded, Male)" },
  { id: "am_echo", label: "Echo (Smooth & Bold, Male)" },
  { id: "am_eric", label: "Eric (Warm & Steady, Male)" },
  { id: "am_fenrir", label: "Fenrir (Authoritative, Male)" },
  { id: "am_liam", label: "Liam (Clear Narration, Male)" },
  { id: "am_michael", label: "Michael (Calm Narrative, Male)" },
  { id: "am_onyx", label: "Onyx (Rich & Warm, Male)" },
  { id: "am_puck", label: "Puck (Energetic, Male)" },
  { id: "am_santa", label: "Santa (Jovial Storyteller, Male)" },

  // American Female Voices
  { id: "af_alloy", label: "Alloy (Crisp & Energetic, Female)" },
  { id: "af_aoede", label: "Aoede (Warm Narration, Female)" },
  { id: "af_bella", label: "Bella (Soft & Natural, Female)" },
  { id: "af_heart", label: "Heart (Soothing, Female)" },
  { id: "af_jessica", label: "Jessica (Clear & Professional, Female)" },
  { id: "af_kore", label: "Kore (Bright, Female)" },
  { id: "af_nicole", label: "Nicole (Clear & Bright, Female)" },
  { id: "af_nova", label: "Nova (Warm Narration, Female)" },
  { id: "af_river", label: "River (Balanced, Female)" },
  { id: "af_sarah", label: "Sarah (Confident Storyteller, Female)" },
  { id: "af_sky", label: "Sky (Crisp & Clear, Female)" },

  // British Male Voices
  { id: "bm_daniel", label: "Daniel (British Presenter, Male)" },
  { id: "bm_fable", label: "Fable (British Storyteller, Male)" },
  { id: "bm_george", label: "George (Traditional British, Male)" },
  { id: "bm_lewis", label: "Lewis (Calm British Narrative, Male)" },

  // British Female Voices
  { id: "bf_alice", label: "Alice (Soft British Accent, Female)" },
  { id: "bf_emma", label: "Emma (Polished British, Female)" },
  { id: "bf_isabella", label: "Isabella (Refined British, Female)" },
  { id: "bf_lily", label: "Lily (Sweet British, Female)" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState(VOICE_OPTIONS[0].id);
  const [pace, setPace] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [tune, setTune] = useState("medium");
  const [reverb, setReverb] = useState(0.0);
  const [warmth, setWarmth] = useState(false);
  const [breathing, setBreathing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Stream UI State
  const [streamProgress, setStreamProgress] = useState(0);
  const [isStreamMuted, setIsStreamMuted] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const streamAudioRef = useRef<HTMLAudioElement | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_profile: voice, pace, pitch, tune, reverb, warmth, breathing }),
      });

      if (!response.ok) {
        let errStr = "Failed to start generation.";
        try {
          const errData = await response.json();
          errStr = errData.detail || errStr;
        } catch { }
        throw new Error(errStr);
      }

      // Backend returns JSON with the completed audio_url immediately
      const data = await response.json();
      setCurrentJobId(data.filename ? data.filename.split('_')[1].split('.')[0] : null);
      setAudioUrl(data.audio_url);
      fetchHistory(); // Refresh history immediately since it's saved

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/preview/${voice}`);
      if (!response.ok) {
        let errStr = "Failed to fetch preview.";
        try { errStr = (await response.json()).detail || errStr; } catch { }
        throw new Error(errStr);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        previewAudioRef.current.play();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to preview voice.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    // We use h-[100dvh] to perfectly fit the view height on all devices, overflow-hidden to prevent body scroll
    <main className="h-[100dvh] w-full bg-white text-gray-900 font-sans flex flex-col relative overflow-hidden">

      {/* Background decoration matching the reference image's soft blue blob */}
      <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-50 blur-[100px] pointer-events-none -z-10"></div>

      {/* Hidden audio element for previews */}
      <audio ref={previewAudioRef} className="hidden" />

      {/* Top Header */}
      <header className="shrink-0 w-full px-6 py-5 sm:px-10 sm:py-6 flex items-center justify-between z-10 border-b border-gray-100 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight">Bongha28</span>
        </div>
        <div className="hidden sm:flex text-sm font-semibold text-gray-500 gap-8">
          <span className="text-black cursor-pointer">Studio</span>
          <span className="hover:text-black transition-colors cursor-pointer">Projects</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`transition-colors cursor-pointer ${showHistory ? 'text-blue-600' : 'hover:text-black'}`}
          >
            History
          </button>
        </div>
        {/* Mimic the "Login / Signup" button style subtly */}
        <div className="hidden sm:flex items-center gap-4">
          <button className="text-sm font-bold border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition">Settings</button>
        </div>
      </header>

      {/* Main Content Area - constrained to remain inside the screen height */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden z-10 relative">

        {/* LEFT COLUMN: Controls */}
        <div className="w-full lg:w-[420px] shrink-0 h-full flex flex-col bg-gray-50/50 border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-sm overflow-y-auto">

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 bg-green-100 text-xs font-bold px-2 py-1 rounded-md tracking-wider uppercase">Studio Ready</span>
              <span className="text-sm font-medium text-gray-500 underline decoration-gray-300">Local processing</span>
            </div>
            {/* Bold black typography mimicking the reference */}
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] text-black">
              Adjust Voice <br /> Parameters
            </h1>
          </div>

          <div className="flex flex-col gap-6 flex-1 pb-10">

            {/* Voice Profile */}
            <div className="flex flex-col gap-3">
              <label htmlFor="voice" className="font-bold text-gray-900 text-sm tracking-wide">Select Voice</label>
              <div className="flex gap-2 items-stretch">
                <div className="relative flex-1">
                  <select
                    id="voice"
                    className="w-full h-full bg-white border border-gray-200 text-gray-900 rounded-xl pl-4 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none shadow-sm cursor-pointer"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <button
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 p-3.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center"
                  title="Preview Voice"
                >
                  {previewLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Core Tuning Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-6">

              {/* Pitch */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-900 text-sm tracking-wide">Pitch Shift</label>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                    {pitch > 0 ? `+${pitch}` : pitch} semi
                  </span>
                </div>
                <input
                  type="range" min="-12" max="12" step="0.5"
                  value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Pace */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-900 text-sm tracking-wide">Pace (Speed)</label>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                    {pace.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.05"
                  value={pace} onChange={(e) => setPace(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Tune (EQ) */}
              <div className="flex flex-col gap-3 pt-2">
                <label className="font-bold text-gray-900 text-sm tracking-wide">Tone Equalizer</label>
                <div className="flex bg-gray-100/80 p-1 rounded-xl">
                  {["low", "medium", "high"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTune(t)}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${tune === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* NEW: Studio Enhancements Card */}
            <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              {/* Reverb */}
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-900 text-sm tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    Reverb (Room Size)
                  </label>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                    {Math.round(reverb * 100)}%
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={reverb} onChange={(e) => setReverb(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Warmth (Compression & Tube) */}
              <div className="flex items-center justify-between pt-2 relative z-10">
                <div className="flex flex-col">
                  <label className="font-bold text-gray-900 text-sm tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                    Studio Warmth
                  </label>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5">Adds depth and compression</span>
                </div>
                <button
                  onClick={() => setWarmth(!warmth)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${warmth ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${warmth ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              {/* Breathing & Intonation (Storyteller mode) */}
              <div className="flex items-center justify-between pt-2 border-t border-indigo-50 relative z-10 mt-2">
                <div className="flex flex-col">
                  <label className="font-bold text-gray-900 text-sm tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Natural Breathing
                  </label>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5">Auto-inserts expressive pauses</span>
                </div>
                <button
                  onClick={() => setBreathing(!breathing)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${breathing ? 'bg-teal-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${breathing ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Script Input & Output (and History overlay) */}
        <div className="flex-1 h-full flex flex-col gap-6 overflow-hidden relative">

          {/* MAIN EDITOR */}
          <div className="flex-1 bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col min-h-0 relative">

            <div className="flex items-center justify-between mb-4 shrink-0 border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Manuscript Editor
              </h2>
              <span className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                {text.length} chars
              </span>
            </div>

            <textarea
              id="script"
              className="flex-1 w-full bg-transparent outline-none text-gray-800 text-lg leading-relaxed placeholder-gray-300 resize-none"
              placeholder="Paste your long-form script here. E.g., Welcome back to Bongha28. Today we will explore the most relaxing facts about plants to fall asleep to..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="shrink-0 pt-4 flex flex-col xl:flex-row items-center justify-between border-t border-gray-100 mt-2 gap-4">

              <div className="flex items-center gap-4 w-full xl:w-auto">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="lg:hidden text-gray-500 hover:bg-gray-100 rounded-full font-bold text-sm px-4 py-2 transition-colors shrink-0"
                >
                  {showHistory ? "Hide History" : "View History"}
                </button>

                {/* Inline Generation Success Player */}
                {audioUrl && !showHistory && (
                  <div className="bg-gray-900 text-white rounded-full pl-5 pr-2 py-2 flex items-center gap-4 shadow-md border border-gray-700 flex-1 xl:flex-initial animate-fade-in min-w-[300px]">

                    {/* Simple Generation Status */}
                    <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">
                            Generation Complete
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Final Player & Download Button */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <audio
                        controls
                        src={audioUrl}
                        className="h-8 outline-none w-32 sm:w-48 custom-audio-player-dark"
                      />
                      <button
                        onClick={() => {
                          const idx = historyList.findIndex((h: any) => h.id === currentJobId);
                          const fileNum = idx !== -1 ? historyList.length - idx : historyList.length + 1;
                          handleDownload(audioUrl, `bongha28-${fileNum}.wav`);
                        }}
                        className="flex-shrink-0 flex items-center justify-center bg-white hover:bg-gray-100 text-black px-4 h-8 rounded-full transition-colors text-xs font-bold gap-2 cursor-pointer"
                        title="Download full audio"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="w-full xl:w-auto bg-black hover:bg-gray-800 text-white font-bold text-[15px] py-3.5 px-8 rounded-full shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  "Generate Audio"
                )}
              </button>
            </div>

            {error && (
              <div className="absolute bottom-24 left-6 right-6 bg-red-50 text-red-800 p-4 rounded-2xl border border-red-100 shadow-sm flex items-start gap-3 z-20">
                <svg className="w-6 h-6 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div className="flex flex-col">
                  <span className="font-bold">Generation Error</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* HISTORY PANEL OVERLAY */}
          {showHistory && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-2xl z-20 flex flex-col animate-fade-in-up">
              <div className="flex items-center justify-between mb-6 shrink-0 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Generation History
                  </h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                {historyList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No history found. Generate some audio first!
                  </div>
                ) : (
                  historyList.map((item, index) => {
                    const date = new Date(item.created_at * 1000).toLocaleString();
                    const voiceLabel = VOICE_OPTIONS.find(v => v.id === item.voice_profile)?.label || item.voice_profile;
                    const fileNum = historyList.length - index;

                    return (
                      <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-blue-200">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed">"{item.text}"</p>
                            <div className="flex flex-wrap gap-2 mt-3 items-center text-xs">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-bold">{voiceLabel}</span>
                              <span className="text-gray-500 font-medium">{date}</span>
                              {item.warmth && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-bold flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> Warm</span>}
                              {item.reverb > 0 && <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md font-bold">Reverb {Math.round(item.reverb * 100)}%</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                          <audio controls className="w-full h-10 outline-none" src={item.audio_url}></audio>
                          <button
                            onClick={() => handleDownload(item.audio_url, `bongha28-${fileNum}.wav`)}
                            className="shrink-0 text-sm font-bold text-gray-600 hover:text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Save
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

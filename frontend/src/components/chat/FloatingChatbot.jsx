import React, { useState, useEffect, useRef } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  FaRobot,
  FaPaperPlane,
  FaSpinner,
  FaArrowDown,
  FaCommentDots,
  FaTimes,
  FaMinus,
  FaUndo
} from "react-icons/fa";

// Custom parser to format bold, headers, bullet lists, code blocks, and Markdown tables
function formatMessageText(text, handleDownloadReport) {
  if (!text) return null;
  const lines = text.split("\n");
  const formattedElements = [];
  
  let inList = false;
  let listItems = [];
  
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Render report download button if token present
    if (line.includes("[DOWNLOAD_REPORT_BUTTON]")) {
      formattedElements.push(
        <div key={`dl-report-btn-${i}`} className="my-2.5 text-center">
          <button
            onClick={handleDownloadReport}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            <span>📥 Download WMS Manifest PDF</span>
          </button>
        </div>
      );
      continue;
    }

    // Handle Markdown Tables
    if (line.startsWith("|")) {
      if (inList) {
        formattedElements.push(
          <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2 pl-2">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      if (line.includes("---")) {
        continue; // Skip the divider row
      }

      const columns = line
        .split("|")
        .map(col => col.trim())
        .filter((col, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (!inTable) {
        inTable = true;
        tableHeaders = columns;
      } else {
        tableRows.push(columns);
      }
      continue;
    } else {
      if (inTable) {
        formattedElements.push(
          <div key={`table-${i}`} className="my-2 overflow-x-auto border border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700 text-slate-300 uppercase font-bold">
                  {tableHeaders.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 font-bold">{h.replace(/\*\*/g, "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-805 text-slate-300 bg-slate-900/10">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2">
                        {cell.startsWith("**") && cell.endsWith("**") ? (
                          <strong className="text-white font-bold">{cell.replace(/\*\*/g, "")}</strong>
                        ) : (
                          cell.replace(/`/g, "")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
    }

    // Handle Headers
    if (line.startsWith("### ")) {
      formattedElements.push(
        <h3 key={i} className="text-[10px] font-bold text-slate-200 mt-3 mb-1 flex items-center gap-1 border-b border-slate-800 pb-0.5 uppercase tracking-wider">
          {line.replace("### ", "").replace(/\*\*/g, "")}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      formattedElements.push(
        <h2 key={i} className="text-xs font-extrabold text-white mt-4 mb-2 flex items-center gap-1 border-b border-slate-800 pb-1">
          {line.replace("## ", "").replace(/\*\*/g, "")}
        </h2>
      );
      continue;
    }

    // Handle Bullet Lists
    if (line.startsWith("* ") || line.startsWith("- ")) {
      const cleanText = line.replace(/^[\*\-]\s+/, "");
      const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);
      const parsedText = parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx} className="text-white font-bold">{part.replace(/\*\*/g, "")}</strong>;
        }
        return part;
      });

      listItems.push(
        <li key={i} className="text-[11px] text-slate-300 leading-relaxed my-0.5">
          {parsedText}
        </li>
      );
      inList = true;
      continue;
    }

    if (inList && !line.startsWith("* ") && !line.startsWith("- ")) {
      formattedElements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {listItems}
        </ul>
      );
      inList = false;
      listItems = [];
    }

    if (line === "") {
      formattedElements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Inline formatting for normal paragraph text
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const parsedLine = parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="text-white font-bold">{part.replace(/\*\*/g, "")}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1 py-0.5 bg-slate-900 text-blue-400 font-mono text-[9px] rounded border border-slate-800">
            {part.replace(/`/g, "")}
          </code>
        );
      }
      return part;
    });

    formattedElements.push(
      <p key={i} className="text-[11px] text-slate-300 leading-relaxed my-0.5">
        {parsedLine}
      </p>
    );
  }

  // Handle edge items
  if (inList) {
    formattedElements.push(
      <ul key={`list-eof`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
        {listItems}
      </ul>
    );
  }
  if (inTable) {
    formattedElements.push(
      <div key={`table-eof`} className="my-2 overflow-x-auto border border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <table className="w-full text-left text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700 text-slate-300 uppercase font-bold">
              {tableHeaders.map((h, hIdx) => (
                <th key={hIdx} className="px-3 py-2 font-bold">{h.replace(/\*\*/g, "")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-805 text-slate-300 bg-slate-900/10">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2">
                    {cell.startsWith("**") && cell.endsWith("**") ? (
                      <strong className="text-white font-bold">{cell.replace(/\*\*/g, "")}</strong>
                    ) : (
                      cell.replace(/`/g, "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return formattedElements;
}

function FloatingChatbot() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your ORBEM AI Assistant. You can ask me questions about your stocked cargo, active shipments, invoices, or customer profile.\n\nHow can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Position coordinates of floating button
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const clickStartCoords = useRef({ x: 0, y: 0 });
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const buttonSize = 56;
  const padding = 16;

  // Suggestions for prompt quick access
  const suggestions = [
    { text: "📦 Summarize my cargo" },
    { text: "🚚 Track active shipments" },
    { text: "💳 Show unpaid invoices" },
    { text: "📄 Generate WMS Manifest PDF" }
  ];

  // Load position relative to viewport boundaries on resize
  useEffect(() => {
    if (!isDragged) return;
    const handleResize = () => {
      setPosition(prev => {
        const newX = Math.max(padding, Math.min(window.innerWidth - buttonSize - padding, prev.x));
        const newY = Math.max(padding, Math.min(window.innerHeight - buttonSize - padding, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragged]);

  // Handle Drag Move (Mouse & Touch)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setIsDragged(true);
      let newX = e.clientX - dragStart.current.x;
      let newY = e.clientY - dragStart.current.y;

      // Keep bot in window bounds
      newX = Math.max(padding, Math.min(window.innerWidth - buttonSize - padding, newX));
      newY = Math.max(padding, Math.min(window.innerHeight - buttonSize - padding, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e) => {
      if (!dragging) return;
      setDragging(false);
      
      // Calculate Euclidean distance to determine if it was a Click or Drag
      const dist = Math.sqrt(
        Math.pow(e.clientX - clickStartCoords.current.x, 2) +
        Math.pow(e.clientY - clickStartCoords.current.y, 2)
      );
      if (dist < 6) {
        setChatOpen(prev => !prev);
      }
    };

    const handleTouchMove = (e) => {
      if (!dragging) return;
      setIsDragged(true);
      const touch = e.touches[0];
      let newX = touch.clientX - dragStart.current.x;
      let newY = touch.clientY - dragStart.current.y;

      newX = Math.max(padding, Math.min(window.innerWidth - buttonSize - padding, newX));
      newY = Math.max(padding, Math.min(window.innerHeight - buttonSize - padding, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = (e) => {
      if (!dragging) return;
      setDragging(false);
      const touch = e.changedTouches[0];
      const dist = Math.sqrt(
        Math.pow(touch.clientX - clickStartCoords.current.x, 2) +
        Math.pow(touch.clientY - clickStartCoords.current.y, 2)
      );
      if (dist < 6) {
        setChatOpen(prev => !prev);
      }
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, position]);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen, loading]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    setDragging(true);
    clickStartCoords.current = { x: e.clientX, y: e.clientY };
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragStart.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragging(true);
    clickStartCoords.current = { x: touch.clientX, y: touch.clientY };
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragStart.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      // Fetch fresh stats and listings in parallel
      const [cargoData, shipmentsData, statsData] = await Promise.all([
        apiService.getCargo(),
        apiService.getShipments(),
        apiService.getDashboardStats()
      ]);
      
      const invoices = statsData.invoices || [];
      
      const { generateOrbemReport } = await import("../../utils/reportGenerator");
      generateOrbemReport(user, cargoData, shipmentsData, invoices);
      
      setMessages(prev => [...prev, {
        sender: "ai",
        text: "📄 **Report Compiled Successfully!** Your official, professional WMS Manifest Report has been generated and sent to the browser print engine.",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: "ai",
        text: `⚠️ **Report Compilation Error**: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e, customText = "") => {
    if (e) e.preventDefault();
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || loading) return;

    // Direct local handler for report requests to avoid LLM delays and enable immediate print
    if (textToSend.includes("Generate WMS Manifest PDF") || textToSend.toLowerCase() === "download report" || textToSend.toLowerCase() === "generate report") {
      const userMsg = {
        sender: "user",
        text: textToSend,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setInputValue("");
      handleDownloadReport();
      return;
    }

    const userMsg = {
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await apiService.askAI(textToSend);
      setMessages(prev => [...prev, {
        sender: "ai",
        text: response.reply || response,
        timestamp: new Date()
      }]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to contact WMS AI.";
      setMessages(prev => [...prev, {
        sender: "ai",
        text: `⚠️ **Connection Failure**: ${msg}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: "ai",
        text: "Chat refreshed. How else can I help you analyze your warehouse profile cargo, shipments, or invoices?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* 1. Floating Draggable Robot Trigger Button */}
      <div
        style={
          isDragged
            ? { left: position.x, top: position.y }
            : { right: "24px", bottom: "24px" }
        }
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`fixed z-50 h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform select-none cursor-grab active:cursor-grabbing border border-blue-400/20`}
        title="Drag me anywhere! Click to ask AI."
      >
        <div className="relative">
          <FaRobot className="text-white text-2xl" />
          <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>
      </div>

      {/* 2. Floating Overlaid Chat Panel Window */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-92 h-[480px] max-h-[75vh] bg-[#0c1225]/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200 text-slate-100">
          
          {/* Header Panel */}
          <div className="px-4 py-3 bg-[#070c1e] border-b border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                <FaRobot className="text-sm" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">ORBEM AI Assistant</h4>
                <p className="text-[9px] text-slate-400">Online | Real-Time WMS Audit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Restart Chat"
              >
                <FaUndo className="text-[10px]" />
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Box */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080d1b]/40 custom-scrollbar scroll-smooth"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 max-w-[90%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div className={`h-6 w-6 rounded-md shrink-0 flex items-center justify-center border font-bold text-[9px] ${
                  msg.sender === "user" 
                    ? "bg-slate-800 border-slate-750 text-white" 
                    : "bg-blue-600/10 border-blue-500/20 text-blue-400"
                }`}>
                  {msg.sender === "user" ? (user?.name?.slice(0, 2).toUpperCase() || "US") : <FaRobot className="text-xs" />}
                </div>

                <div className="space-y-0.5">
                  <div className={`p-3 rounded-xl border text-xs leading-normal ${
                    msg.sender === "user"
                      ? "bg-blue-600 border-blue-650 text-white rounded-tr-none"
                      : "bg-[#131b31] border-slate-800 rounded-tl-none text-slate-200"
                  }`}>
                    {msg.sender === "user" ? (
                      <p className="break-words whitespace-pre-wrap text-[11px]">{msg.text}</p>
                    ) : (
                      <div className="space-y-0.5">
                        {formatMessageText(msg.text, handleDownloadReport)}
                      </div>
                    )}
                  </div>
                  <p className={`text-[8px] text-slate-500 font-mono px-0.5 ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center bg-blue-600/10 border border-blue-500/20 text-blue-400">
                  <FaRobot className="text-xs" />
                </div>
                <div className="p-3 bg-[#131b31] border border-slate-850 rounded-xl rounded-tl-none flex items-center gap-1.5">
                  <FaSpinner className="animate-spin text-blue-400 text-[10px]" />
                  <span className="text-[9px] text-slate-400">Reading databases...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions panel */}
          <div className="px-4 py-2 bg-[#070c1e]/60 border-t border-slate-800 shrink-0">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  onClick={(e) => handleSendMessage(e, sug.text)}
                  disabled={loading}
                  className="text-[9px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white border border-slate-750 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sug.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input control form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#050917] border-t border-slate-800 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask AI e.g. Show my cargo weight..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white p-2 rounded-xl flex items-center justify-center cursor-pointer shrink-0 disabled:text-slate-500"
            >
              {loading ? (
                <FaSpinner className="animate-spin text-xs" />
              ) : (
                <FaPaperPlane className="text-[10px]" />
              )}
            </button>
          </form>

        </div>
      )}
    </>
  );
}

export default FloatingChatbot;

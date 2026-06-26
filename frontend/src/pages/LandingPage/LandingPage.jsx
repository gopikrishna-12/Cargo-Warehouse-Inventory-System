import { Link } from "react-router-dom";
import {
  FiShield,
  FiPackage,
  FiTruck,
  FiLayers,
  FiFileText,
  FiBarChart2,
  FiUsers
} from "react-icons/fi";

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      
      {/* Global Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center transform rotate-45">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-sm transform -rotate-45" />
            </div>
            <div className="flex flex-col select-none">
              <span className="font-extrabold text-sm tracking-[0.1em] text-white leading-none uppercase">
                ORBEM
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] leading-none uppercase mt-1">
                SOLUTIONS
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => alert("Contact Sales (Simulation)")}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Contact Sales
            </button>
            
            <Link
              to="/login"
              className="bg-[#0d1527] hover:bg-[#14203d] border border-slate-800/80 text-white font-semibold rounded-xl px-5 py-2 text-sm transition-all cursor-pointer"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center bg-[#020817] overflow-hidden">
        
        {/* Full-width Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="/warehouse_hero.png"
            alt="Modern Automated Warehouse Background"
            className="w-full h-full object-cover object-right lg:object-center"
          />
          {/* Seamless gradient blend to ensure text legibility and contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/40 to-transparent pointer-events-none" />
        </div>

        {/* Content Container (Overlaying Left Side) */}
        <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12 z-10 pt-24 pb-12 lg:py-0">
          <div className="w-full lg:w-[50%] space-y-7">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-slate-800 bg-[#070c1e]/45 text-slate-300 rounded-full text-[10px] font-bold tracking-[0.08em] uppercase select-none w-max">
              <FiShield className="text-blue-500 text-xs" />
              <span>Enterprise Logistics Intelligence</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-white leading-[1.1] tracking-tight">
              Logistics visibility <br />
              without the blind <br />
              spots.
            </h1>

            {/* Subheading */}
            <h2 className="text-base md:text-lg lg:text-xl font-medium text-slate-200 leading-snug">
              Smart Logistics. Intelligent Warehousing. Real-Time Visibility.
            </h2>

            {/* Description */}
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg font-light">
              One secure platform for cargo operations, warehouse capacity, dispatch coordination, customer visibility, and compliance.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                Access platform <span className="text-sm">→</span>
              </Link>
              <button
                onClick={() => alert("Request Demo registered (Simulation)")}
                className="border border-slate-800 bg-[#0c1020]/60 hover:bg-[#121933] text-white font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Request demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-[#020817] py-8 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#0c1328] border border-slate-800/80 rounded-2xl py-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800/50">
            {/* Stat Item 1 */}
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">250,000+</span>
              <span className="text-xs md:text-sm text-slate-400 mt-2 font-light">Cargo processed</span>
            </div>
            {/* Stat Item 2 */}
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">1,500+</span>
              <span className="text-xs md:text-sm text-slate-400 mt-2 font-light">Clients supported</span>
            </div>
            {/* Stat Item 3 */}
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">99.9%</span>
              <span className="text-xs md:text-sm text-slate-400 mt-2 font-light">Platform uptime</span>
            </div>
            {/* Stat Item 4 */}
            <div className="flex flex-col items-center justify-center p-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">120+</span>
              <span className="text-xs md:text-sm text-slate-400 mt-2 font-light">Warehouses managed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Operations / Feature Grid Section */}
      <section className="py-20 bg-[#020817] px-6">
        <div className="max-w-[1280px] mx-auto space-y-16">
          <div className="space-y-4">
            <span className="text-blue-500 font-bold text-xs uppercase tracking-wider block">
              CONNECTED OPERATIONS
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Everything your logistics team needs to move with confidence.
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed font-light">
              Built for the people managing the warehouse floor, dispatch desk, customer relationship, and executive view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cargo Management */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiPackage className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Cargo Management</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Control cargo intake, storage, movement, and dispatch from one operational record.
              </p>
            </div>

            {/* Shipment Tracking */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiTruck className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Shipment Tracking</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Monitor routes, delivery status, delays, and dispatch performance in real time.
              </p>
            </div>

            {/* Warehouse Management */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiLayers className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Warehouse Management</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Understand capacity, zone utilization, and placement across every facility.
              </p>
            </div>

            {/* Document Repository */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiFileText className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Document Repository</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Securely organize manifests, invoices, certificates, and cargo documents.
              </p>
            </div>

            {/* Analytics & Reports */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiBarChart2 className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Analytics & Reports</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Turn operational data into clear performance and capacity intelligence.
              </p>
            </div>

            {/* Customer Portal */}
            <div className="bg-[#0b1224] border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-10 h-10 bg-[#0e1730] border border-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <FiUsers className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-base">Customer Portal</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-light">
                Give customers focused visibility into their own cargo, documents, and deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Orbem Section */}
      <section className="bg-[#020817] py-20 px-6 border-t border-slate-900/60">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-blue-500 font-bold text-xs uppercase tracking-wider block">
              WHY ORBEM
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Operational control that scales with your network.
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-light">
              ORBEM WMS replaces fragmented calls, messages, spreadsheets, and paperwork with one accountable source of truth.
            </p>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Badge 1 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Real-time cargo visibility</span>
            </div>

            {/* Badge 2 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Multi-role operational access</span>
            </div>

            {/* Badge 3 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Secure cloud document storage</span>
            </div>

            {/* Badge 4 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Warehouse capacity intelligence</span>
            </div>

            {/* Badge 5 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Complete audit trails</span>
            </div>

            {/* Badge 6 */}
            <div className="flex items-center gap-3.5 bg-[#0b1224] border border-slate-800/40 rounded-xl px-5 py-4">
              <div className="w-6 h-6 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-xs md:text-sm">Enterprise-grade reporting</span>
            </div>

          </div>
        </div>
      </section>

      {/* Branding Footer */}
      <footer className="bg-[#020817] border-t border-slate-900/80 px-6">
        <div className="max-w-[1280px] mx-auto py-12 flex flex-col gap-10">
          
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center transform rotate-45">
                <div className="w-3.5 h-3.5 border-2 border-white rounded-sm transform -rotate-45" />
              </div>
              <div className="flex flex-col select-none">
                <span className="font-extrabold text-sm tracking-[0.1em] text-white leading-none uppercase">
                  ORBEM
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] leading-none uppercase mt-1">
                  SOLUTIONS
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-xs md:text-sm font-light max-w-xl lg:max-w-md">
              Enterprise logistics and intelligent warehousing technology by ORBEM SOLUTIONS.
            </p>

            {/* Email */}
            <a
              href="mailto:support@orbemsolutions.com"
              className="text-slate-350 hover:text-white transition-colors font-medium text-xs md:text-sm cursor-pointer"
            >
              support@orbemsolutions.com
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-900/60" />

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 gap-4">
            <span>© 2026 ORBEM SOLUTIONS. All rights reserved.</span>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#privacy" onClick={(e) => {e.preventDefault(); alert("Privacy Policy (Simulation)")}} className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" onClick={(e) => {e.preventDefault(); alert("Terms (Simulation)")}} className="hover:text-white transition-colors">Terms</a>
              <a href="#support" onClick={(e) => {e.preventDefault(); alert("Support (Simulation)")}} className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

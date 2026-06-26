import { FaArrowUp, FaArrowDown } from "react-icons/fa";

function StatCard({ title, value, icon: Icon, iconBg, trend, trendType }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 flex justify-between items-start hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </p>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              trendType === "up" 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {trendType === "up" ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
              {trend}
            </span>
            <span className="text-slate-400 text-xs font-medium">vs last month</span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-4 rounded-xl shrink-0 ${iconBg || "bg-slate-50 text-slate-600"}`}>
          <Icon className="text-xl" />
        </div>
      )}
    </div>
  );
}

export default StatCard;
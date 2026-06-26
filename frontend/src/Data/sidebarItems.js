import {
  FaChartPie,
  FaBox,
  FaTruck,
  FaWarehouse,
  FaUsers,
  FaFileAlt,
  FaChartBar,
  FaCog
} from "react-icons/fa";

export const sidebarItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: FaChartPie,
    badge: "Live",
  },
  {
    title: "Cargo Management",
    path: "/cargo",
    icon: FaBox,
    badge: "18",
  },
  {
    title: "Shipments",
    path: "/shipments",
    icon: FaTruck,
    badge: "3 Active",
  },
  {
    title: "Warehouse",
    path: "/warehouse",
    icon: FaWarehouse,
    badge: "4 Zones",
  },
  {
    title: "Customers",
    path: "/customers",
    icon: FaUsers,
    badge: "12 Clients",
  },
  {
    title: "Documents",
    path: "/documents",
    icon: FaFileAlt,
    badge: "8",
  },
  {
    title: "Reports",
    path: "/reports",
    icon: FaChartBar,
    badge: "New",
  },
  {
    title: "Settings",
    path: "/settings",
    icon: FaCog,
    badge: "System",
  },
];
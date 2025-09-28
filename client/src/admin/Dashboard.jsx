import React from "react";
import { motion } from "framer-motion";
import {
  FaPaw,
  FaCalendarAlt,
  FaDollarSign,
  FaBoxOpen,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";


const metrics = [
  { name: "Total Pets", value: 324, delta: +12, icon: <FaPaw /> },
  { name: "Appts Today", value: 18, delta: -3, icon: <FaCalendarAlt /> },
  { name: "Revenue", value: "$4,280", delta: +7, icon: <FaDollarSign /> },
  { name: "Low Stock", value: 6, delta: 0, icon: <FaBoxOpen /> },
];

const appointmentsTrend = [
  { day: "Mon", appts: 12 },
  { day: "Tue", appts: 15 },
  { day: "Wed", appts: 9 },
  { day: "Thu", appts: 18 },
  { day: "Fri", appts: 22 },
  { day: "Sat", appts: 14 },
  { day: "Sun", appts: 8 },
];

const revenueByService = [
  { name: "Vaccinations", value: 1200 },
  { name: "Checkups", value: 900 },
  { name: "Grooming", value: 700 },
  { name: "Surgeries", value: 1480 },
];

const speciesMix = [
  { name: "Dogs", value: 58 },
  { name: "Cats", value: 32 },
  { name: "Birds", value: 6 },
  { name: "Other", value: 4 },
];

const recentAppointments = [
  { id: 1, pet: "Buddy", owner: "Anu P.", time: "09:30", type: "Checkup" },
  { id: 2, pet: "Mittens", owner: "Ravi K.", time: "10:15", type: "Vaccination" },
  { id: 3, pet: "Rocky", owner: "Sithmi D.", time: "11:00", type: "Grooming" },
  { id: 4, pet: "Snow", owner: "Ishan T.", time: "13:45", type: "Dental" },
];

const lowStock = [
  { id: 1, name: "Flea Shampoo", stock: 8 },
  { id: 2, name: "Deworming Tabs", stock: 14 },
  { id: 3, name: "Bandages", stock: 5 },
  { id: 4, name: "Cat Litter", stock: 11 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, type: "spring", stiffness: 120 } }),
};

export default function Dashboard() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-amber-50 min-h-screen">
 
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back 👋</h1>
          <p className="text-gray-600">Here’s what’s happening at your clinic today.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          className="px-4 py-2 rounded-2xl bg-amber-500 text-white shadow hover:shadow-md"
        >
          New Appointment
        </motion.button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.name}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl bg-white shadow-sm p-4 flex items-center gap-4 border border-amber-100 hover:shadow-md transition"
          >
            <div className="text-amber-600 text-3xl bg-amber-50 p-3 rounded-xl">
              {m.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{m.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
              <div className={`flex items-center gap-1 text-sm ${m.delta > 0 ? "text-green-600" : m.delta < 0 ? "text-red-600" : "text-gray-500"}`}>
                {m.delta > 0 ? <FaArrowUp /> : m.delta < 0 ? <FaArrowDown /> : null}
                <span>{m.delta > 0 ? `+${m.delta}%` : m.delta < 0 ? `${m.delta}%` : "—"} this week</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white shadow-sm p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Appointments (Last 7 days)</h3>
            <span className="text-xs text-gray-500">live</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="appts" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-white shadow-sm p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Revenue by Service (LKR)</h3>
            <span className="text-xs text-gray-500">this week</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByService} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

       
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-white shadow-sm p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Patient Species Mix</h3>
            <span className="text-xs text-gray-500">clinic-wide</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={speciesMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {speciesMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#f59e0b", "#fb923c", "#fed7aa", "#fde68a"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
 
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl bg-white shadow-sm p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
            <button className="text-amber-600 text-sm hover:underline">View all</button>
          </div>
          <ul className="divide-y">
            {recentAppointments.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <FaPaw />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.pet} <span className="text-gray-500 font-normal">• {a.type}</span></p>
                    <p className="text-sm text-gray-500">Owner: {a.owner}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-800">{a.time}</span>
              </li>
            ))}
          </ul>
        </motion.div>

    
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-white shadow-sm p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
            <button className="text-amber-600 text-sm hover:underline">Manage</button>
          </div>
          <ul className="divide-y">
            {lowStock.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">Stock remaining</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${p.stock <= 8 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                  {p.stock}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

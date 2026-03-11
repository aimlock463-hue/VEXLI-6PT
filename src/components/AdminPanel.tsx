import React from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, BarChart, ArrowLeft, ShieldCheck, TrendingUp } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const stats = [
    { label: 'Total Users', value: '1,284', icon: Users, color: 'text-blue-400' },
    { label: 'Premium Users', value: '432', icon: ShieldCheck, color: 'text-brand-primary' },
    { label: 'Daily Revenue', value: '$842.50', icon: CreditCard, color: 'text-emerald-400' },
    { label: 'AI Requests', value: '12.4k', icon: TrendingUp, color: 'text-brand-secondary' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col"
    >
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <button onClick={onClose} className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to App</span>
        </button>
        <h2 className="text-lg font-bold">Admin Dashboard</h2>
        <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center">
          <BarChart className="w-5 h-5 text-brand-primary" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-4">
              <stat.icon className={`w-5 h-5 mb-3 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <section>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            Recent Users
          </h3>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Plan</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: 'Alex Rivera', email: 'alex@example.com', plan: 'Premium', status: 'Active' },
                  { name: 'Sarah Chen', email: 'sarah@example.com', plan: 'Free', status: 'Active' },
                  { name: 'Mike Ross', email: 'mike@example.com', plan: 'Premium', status: 'Trial' },
                  { name: 'Elena G.', email: 'elena@example.com', plan: 'Free', status: 'Inactive' },
                ].map((user, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-white/30">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${user.plan === 'Premium' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/10 text-white/50'}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="p-4 text-white/50">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-secondary" />
            Usage Analytics
          </h3>
          <div className="glass-card p-6 h-48 flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-secondary/20 rounded-t-sm relative group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="absolute bottom-0 left-0 right-0 bg-brand-secondary rounded-t-sm"
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}k
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1 text-[8px] text-white/30 uppercase">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </section>
      </main>
    </motion.div>
  );
}

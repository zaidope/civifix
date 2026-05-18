import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

function Statistics() {
  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      number: "10,000+",
      label: "Active Citizens",
      color: "text-blue-400",
      bgColor: "bg-blue-900/40 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      number: "5,000+",
      label: "Issues Resolved",
      color: "text-green-400",
      bgColor: "bg-green-900/40 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      number: "24/7",
      label: "Support Available",
      color: "text-purple-400",
      bgColor: "bg-purple-900/40 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      number: "95%",
      label: "Satisfaction Rate",
      color: "text-orange-400",
      bgColor: "bg-orange-900/40 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
    }
  ];

  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="container mx-auto px-5">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Making a Real Difference
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our platform has transformed how citizens engage with local governance, 
            creating a more responsive and accountable system.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bgColor} mb-4`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              <h3 className={`text-4xl font-bold ${stat.color} mb-2`}>
                {stat.number}
              </h3>
              <p className="text-gray-400 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;

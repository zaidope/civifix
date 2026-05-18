import React from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Shield, 
  Clock, 
  Users, 
  BarChart3, 
  Globe,
  Bell,
  Camera,
  MapPin,
  MessageSquare
} from "lucide-react";

function Features() {
  const features = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile-First Design",
      description: "Access the platform from any device. Our responsive design ensures a seamless experience on smartphones, tablets, and desktops.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your personal information is protected with enterprise-grade security. We follow strict data privacy protocols to keep your data safe.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Availability",
      description: "Report issues anytime, anywhere. Our platform is always available, ensuring your concerns are captured even outside business hours.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Driven",
      description: "Join thousands of citizens working together to improve their communities. See what issues others are reporting in your area.",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Track resolution times, success rates, and department performance. Transparent data helps improve governance efficiency.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Multi-Language Support",
      description: "Access the platform in your preferred language. We support multiple regional languages to ensure inclusivity.",
      color: "text-teal-600",
      bgColor: "bg-teal-100"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Smart Notifications",
      description: "Get instant updates via SMS, email, and push notifications. Never miss an update about your complaint status.",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Photo Evidence",
      description: "Attach photos and documents to support your complaint. Visual evidence helps officials understand and resolve issues faster.",
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Location Services",
      description: "Pinpoint exact locations using GPS. Help officials find and address issues with precise location data.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Two-Way Communication",
      description: "Chat directly with assigned officers. Ask questions, provide additional information, and get personalized updates.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100"
    }
  ];

  return (
    <section className="py-20 bg-[#050505]">
      <div className="container mx-auto px-5">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to engage with local governance effectively. 
            Our platform combines cutting-edge technology with user-friendly design.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 group backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-black/40 border border-white/10 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className={feature.color}>
                  {feature.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;

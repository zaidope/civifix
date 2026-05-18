import React from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  Users, 
  Shield, 
  Zap, 
  Heart, 
  Globe,
  Award,
  TrendingUp,
  CheckCircle,
  Lightbulb
} from "lucide-react";
import aboutVideo from "../Assets/videos/1761411045195.mp4";
import HomeAbout from "./home/About";
import HowItWorks from "./home/HowItWorks";
import Features from "./home/Features";
import Statistics from "./home/Statistics";
import Testimonials from "./home/Testimonials";

function About() {
  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Transparency",
      description: "Every interaction is recorded and visible, ensuring complete accountability in the governance process.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Inclusivity",
      description: "We believe every citizen's voice matters. Our platform ensures equal access to governance services.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security",
      description: "Your data is protected with enterprise-grade security measures and privacy-first design principles.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Efficiency",
      description: "Streamlined processes and smart automation ensure quick resolution of citizen grievances.",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Citizens Served", icon: <Users className="w-6 h-6" /> },
    { number: "25,000+", label: "Issues Resolved", icon: <CheckCircle className="w-6 h-6" /> },
    { number: "95%", label: "Satisfaction Rate", icon: <Heart className="w-6 h-6" /> },
    { number: "24/7", label: "Support Available", icon: <Globe className="w-6 h-6" /> }
  ];

  const team = [
    {
      name: "Zaid Azeemulla",
      role: "Creator & Lead Developer",
      image: "https://ui-avatars.com/api/?name=Zaid+Azeemulla&background=4f46e5&color=fff&size=300",
      description: "Architect and developer of the platform. Passionate about leveraging technology to bridge the gap between citizens and local governance."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={aboutVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-5 text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            About Our Mission
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            We're revolutionizing citizen-government interaction through technology, 
            transparency, and trust. Our platform bridges the gap between citizens and 
            local authorities, creating a more responsive and accountable governance system.
          </motion.p>
        </div>
      </section>

      {/* Video Section */}
      <section className="pt-8 pb-20 bg-gray-100">
        <div className="container mx-auto px-5">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* <h2 className="text-4xl font-bold text-gray-900 mb-4">See Us In Action</h2> */}
            {/* <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how our platform is transforming citizen-government interaction across communities.
            </p> */}
          </motion.div>

          <motion.div
            className="bg-gray-200 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* <h3 className="text-2xl font-bold text-gray-700 mb-6">Platform Demo Video</h3> */}
            <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
              <video
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source src={aboutVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-gray-600 mt-4">
              Watch how our platform transforms citizen-government interaction
            </p>
          </motion.div>
        </div>
      </section>

      <HomeAbout />

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  To democratize access to governance by providing citizens with a transparent, 
                  efficient, and user-friendly platform to voice their concerns and track 
                  their resolution. We believe that technology can bridge the gap between 
                  citizens and government, fostering trust and accountability.
                </p>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  A world where every citizen has a direct, meaningful connection with 
                  their government. We envision communities where transparency is the norm, 
                  accountability is expected, and citizen engagement drives positive change 
                  in local governance.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-5">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do, from platform design to community engagement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${value.bgColor} mb-6`}>
                  <div className={value.color}>
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <Features />
      <Statistics />

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-5">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate individuals working together to build a better future for citizen governance.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-lg transition-shadow duration-300 w-full md:w-1/3"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-600 leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Join the Movement</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Be part of the digital transformation that's making governance more transparent, 
              accountable, and citizen-centric.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Today
              </motion.button>
              <motion.button
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default About;

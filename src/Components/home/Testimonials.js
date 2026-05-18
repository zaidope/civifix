import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Bengaluru",
      role: "Resident",
      content: "The grievance portal has been a game-changer! I reported a broken streetlight and it was fixed within 3 days. The transparency and updates kept me informed throughout the process.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Rajesh Kumar",
      location: "Mumbai",
      role: "Business Owner",
      content: "As a small business owner, I was struggling with water supply issues. This platform connected me directly with the right department, and my problem was resolved efficiently.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Anita Patel",
      location: "Delhi",
      role: "Teacher",
      content: "The user-friendly interface makes it so easy to report issues. I love how I can track the progress and get updates. It's like having a direct line to the government!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  return (
    <section className="py-20 bg-[#000]">
      <div className="container mx-auto px-5">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            What Citizens Say
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real stories from real people who have experienced the power of 
            transparent governance through our platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-[#111] border border-gray-800 p-8 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-blue-500 mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4 border border-gray-700"
                />
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;

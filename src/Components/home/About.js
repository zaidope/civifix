import React from "react";
import citizenEmpowerment from "../../Assets/images/Citizen Empowerment.png";
import complainRegistration from "../../Assets/images/Complain Registeration.png";
import tracking from "../../Assets/images/tracking.png";
import resolution from "../../Assets/images/resolution.png";

function About() {
  return (
    <div className="bg-gray-50">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto">
          {/* Header Section */}
          <div className="flex flex-wrap w-full mb-20">
            <div className="lg:w-1/2 w-full mb-6 lg:mb-0">
              <h1 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 pr-10">
                Citizen Grievance Redressal & Public Service Feedback System
              </h1>
              <div className="h-1 w-20 bg-purple-600 rounded" />
            </div>
            <p className="lg:w-1/2 w-full leading-relaxed text-gray-600 text-sm">
              The Citizen Grievance Redressal System provides a transparent and
              accessible platform for citizens to raise issues related to
              municipal services, infrastructure, and governance. It ensures
              that every concern — from sanitation and roads to electricity and
              water supply — reaches the responsible authorities promptly and is
              resolved efficiently.
            </p>
          </div>

          {/* Features Section */}
          <div className="flex flex-wrap -m-4">
            {/* Feature 1 */}
            <div className="xl:w-1/4 md:w-1/2 p-4">
              <div className="bg-gray-100 p-6 rounded-lg hover:shadow-lg transition duration-300">
                <img
                  className="h-40 rounded w-full object-cover object-center mb-6"
                  src={citizenEmpowerment}
                  alt="Citizen Empowerment"
                />
                <h3 className="tracking-widest text-purple-600 text-xs font-medium title-font">
                  FEATURE 01
                </h3>
                <h2 className="text-lg text-gray-900 font-medium title-font mb-4">
                  Empowering Citizens
                </h2>
                <p className="leading-relaxed text-base">
                  Citizens can easily register complaints online and track their
                  progress in real time, ensuring that every voice is heard and
                  acted upon responsibly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="xl:w-1/4 md:w-1/2 p-4">
              <div className="bg-gray-100 p-6 rounded-lg hover:shadow-lg transition duration-300">
                <img
                  className="h-40 rounded w-full object-cover object-center mb-6"
                  src={complainRegistration}
                  alt="Complaint Registration"
                />
                <h3 className="tracking-widest text-purple-600 text-xs font-medium title-font">
                  FEATURE 02
                </h3>
                <h2 className="text-lg text-gray-900 font-medium title-font mb-4">
                  Seamless Complaint Logging
                </h2>
                <p className="leading-relaxed text-base">
                  From potholes to power cuts, citizens can file complaints in a
                  few clicks. The system ensures that no grievance goes
                  unnoticed or forgotten.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="xl:w-1/4 md:w-1/2 p-4">
              <div className="bg-gray-100 p-6 rounded-lg hover:shadow-lg transition duration-300">
                <img
                  className="h-40 rounded w-full object-cover object-center mb-6"
                  src={tracking}
                  alt="Smart Tracking & Transparency"
                />
                <h3 className="tracking-widest text-purple-600 text-xs font-medium title-font">
                  FEATURE 03
                </h3>
                <h2 className="text-lg text-gray-900 font-medium title-font mb-4">
                  Smart Tracking & Transparency
                </h2>
                <p className="leading-relaxed text-base">
                  The system maintains all complaints digitally and provides
                  live updates on their resolution status to both citizens and
                  officials for accountability.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="xl:w-1/4 md:w-1/2 p-4">
              <div className="bg-gray-100 p-6 rounded-lg hover:shadow-lg transition duration-300">
                <img
                  className="h-40 rounded w-full object-cover object-center mb-6"
                  src={resolution}
                  alt="Efficient Resolution"
                />
                <h3 className="tracking-widest text-purple-600 text-xs font-medium title-font">
                  FEATURE 04
                </h3>
                <h2 className="text-lg text-gray-900 font-medium title-font mb-4">
                  Efficient Resolution
                </h2>
                <p className="leading-relaxed text-base">
                  Assigned officials can view, prioritize, and respond to issues
                  efficiently. Citizens receive notifications when their
                  grievances are resolved.
                </p>
              </div>
            </div>
          </div>

          {/* Closing Note */}
          <div className="mt-16 text-center">
            <p className="text-gray-700 leading-relaxed text-md">
              This system bridges the gap between citizens and local authorities
              — ensuring accountability, efficiency, and trust in public
              service. Together, we make governance responsive and citizen-first.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;

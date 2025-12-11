import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* University Logo + Name */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-2xl mb-6">
            <img src="/Logo.png" alt="University Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Singhania University
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Diploma • Degree • PG • PhD (Private University)
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Pacheri Bari, Rajasthan 333515
          </p>
        </div>

        {/* Two Big Cards */}
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Student Login Card */}
          <button
            onClick={() => navigate("/login")}
            className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-0 group-hover:opacity-90 transition-opacity" />
            <div className="relative p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-40 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292A4 4 0 0112 4.354zM15 21H9v-2a4 4 0 014-4h2a4 4 0 014 4v2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Student Login</h2>
              <p className="text-gray-600 text-lg">
                Access your dashboard, fees, results & attendance
              </p>
              <p className="mt-6 text-blue-600 font-semibold text-lg group-hover:text-white transition-colors">
                Login with Enrollment Number → 
              </p>
            </div>
          </button>

          {/* Staff / Admin Login Card */}
          <button
            onClick={() => navigate("/admin/login")}
            className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-90 transition-opacity" />
            <div className="relative p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-40 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Staff / Admin Login</h2>
              <p className="text-gray-600 text-lg">
                Manage students, fees, attendance & reports
              </p>
              <p className="mt-6 text-emerald-600 font-semibold text-lg group-hover:text-white transition-colors">
                Login with Username → 
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 Singhania University • Powered by SlashCurate Technologies Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
}
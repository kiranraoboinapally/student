import { GraduationCap, User, ArrowRight, School } from "lucide-react"

export default function LandingPage() {
  const openInNewTab = (path: string) => {
    window.open(`${window.location.origin}${path}`, "_blank", "noopener,noreferrer");
  };

  const rightPanelGradient = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal" as const,
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL - Logo & Welcome */}
        <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
            <img
              src="/Logo.png"
              alt="ABCD University"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">
            ABCD University
          </h1>

          <p className="mt-3 text-lg font-semibold text-gray-700">
            Diploma • Degree • PG • PhD
          </p>
          <p className="text-sm text-gray-600 font-medium">
            (Private University)
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Location, State Pincode
          </p>

          <div className="mt-10 text-gray-600 font-medium">
            Welcome to the Portal
          </div>
        </div>

        {/* RIGHT PANEL - Login Options with exact same gradient */}
        <div
          className="w-full lg:w-[65%] flex flex-col justify-center p-12 text-white"
          style={rightPanelGradient}
        >
          <div className="max-w-lg mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-12">
              ERP LOGIN
            </h2>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Student Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openInNewTab("/login")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openInNewTab("/login")}
                className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center 
                           cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white 
                           hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#650C08] flex items-center justify-center
                                transition-all duration-400 group-hover:bg-white group-hover:ring-8 group-hover:ring-[#650C08]/30">
                  <GraduationCap className="w-10 h-10 text-white transition-all duration-400 
                                            group-hover:text-[#650C08] group-hover:scale-110" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Student</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Results, Fees & Attendance
                </p>
                <div className="flex items-center justify-center gap-2 text-[#650C08] font-bold text-sm">
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>

              {/* Institute Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openInNewTab("/admin/login")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openInNewTab("/admin/login")}
                className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center 
                           cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white 
                           hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#650C08] flex items-center justify-center
                                transition-all duration-400 group-hover:bg-white group-hover:ring-8 group-hover:ring-[#650C08]/30">
                  <School className="w-10 h-10 text-white transition-all duration-400 
                                   group-hover:text-[#650C08] group-hover:scale-110" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Institute</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Manage College Data
                </p>
                <div className="flex items-center justify-center gap-2 text-[#650C08] font-bold text-sm">
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>

              {/* University Admin Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openInNewTab("/admin/login")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openInNewTab("/admin/login")}
                className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center 
                           cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white 
                           hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#650C08] flex items-center justify-center
                                transition-all duration-400 group-hover:bg-white group-hover:ring-8 group-hover:ring-[#650C08]/30">
                  <User className="w-10 h-10 text-white transition-all duration-400 
                                   group-hover:text-[#650C08] group-hover:scale-110" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">University</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Super Admin Controls
                </p>
                <div className="flex items-center justify-center gap-2 text-[#650C08] font-bold text-sm">
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </div>

            {/* Footer inside right panel */}
            <div className="mt-16 text-center text-sm opacity-90">
              <p>ERP • Powered by <span className="font-bold">SlashCurate Technologies Pvt Ltd</span></p>
              <p className="mt-2">© 2025 ABCD University. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
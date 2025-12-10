import React, { useEffect, useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";

export default function StudentProfile() {
  const { authFetch, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // controller /profile/me returns { user, master_student, act_student }
        const res = await authFetch(`${apiBase}/profile/me`);
        if (!res.ok) {
          if (res.status === 401) {
            // token invalid/expired -> logout
            logout();
          }
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to fetch profile");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setProfile(data);
      } catch (err) {
        setError("Network error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <div className="bg-white shadow rounded p-4">
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </div>
  );
}

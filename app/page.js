"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [scansLeft, setScansLeft] = useState(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchScansLeft(session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchScansLeft(session.user.id);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchScansLeft = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("scans_left")
      .eq("id", userId)
      .single();

    if (data) setScansLeft(data.scans_left);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze image");

      setResult(data);
      if (data.scans_left !== undefined) setScansLeft(data.scans_left);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <div className="max-w-md w-full space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-indigo-400">AI Visual Search</h1>
          {user && scansLeft !== null && (
            <p className="text-sm bg-indigo-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-full inline-block text-indigo-200">
              Scans Remaining: <span className="font-bold text-indigo-400">{scansLeft}</span>
            </p>
          )}
        </header>

        {!user ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-semibold text-center">
              {isSignUp ? "Create Beta Account" : "Sign In"}
            </h2>
            {authError && (
              <p className="text-sm text-red-400 text-center bg-red-950/50 p-2 rounded-lg border border-red-800/50">
                {authError}
              </p>
            )}
            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg transition-all"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>
            <p className="text-xs text-center text-slate-400">
              {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-400 underline font-medium"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-500"
              />

              {image && (
                <div className="relative rounded-lg overflow-hidden border border-slate-800">
                  <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={loading || !image || scansLeft <= 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold rounded-lg transition-all"
              >
                {loading ? "Analyzing..." : scansLeft <= 0 ? "Quota Finished" : "Scan Image"}
              </button>
            </div>

            {result && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
                <h3 className="text-xl font-bold text-indigo-300">{result.title}</h3>
                <p className="text-sm text-slate-300">{result.summary}</p>
                {result.facts && (
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    {result.facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

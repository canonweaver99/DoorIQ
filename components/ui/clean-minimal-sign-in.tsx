"use client"

import * as React from "react"
import { useState } from "react";
import { LogIn, Lock, Mail } from "lucide-react";

const SignIn2 = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    alert("Sign in successful! (Demo)");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-800/70 to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-slate-700 text-slate-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-6 shadow-lg border border-slate-700">
          <LogIn className="w-7 h-7 text-slate-100" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Sign in with email
        </h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Practice smarter with DoorIQ. Join your team in seconds.
        </p>
        <div className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer text-xs select-none"></span>
          </div>
          <div className="w-full flex justify-between items-center min-h-5">
            {error && (
              <div className="text-sm text-red-400">{error}</div>
            )}
            <button className="text-xs hover:underline font-medium text-blue-400 ml-auto">
              Forgot password?
            </button>
          </div>
        </div>
        <button
          onClick={handleSignIn}
          className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2"
        >
          Get Started
        </button>
        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-dashed border-slate-700"></div>
          <span className="mx-2 text-xs text-slate-400">Or sign in with</span>
          <div className="flex-grow border-t border-dashed border-slate-700"></div>
        </div>
        <div className="flex gap-3 w-full justify-center mt-2">
          <button className="flex items-center justify-center w-12 h-12 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 transition grow">
            <img
              src="https://images.unsplash.com/photo-1611162618071-b39a2ec4b0b4?w=64&h=64&fit=crop&crop=faces"
              alt="Google"
              className="w-6 h-6 rounded"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 transition grow">
            <img
              src="https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=64&h=64&fit=crop&crop=faces"
              alt="Facebook"
              className="w-6 h-6 rounded"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 transition grow">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces"
              alt="Apple"
              className="w-6 h-6 rounded"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export { SignIn2 };



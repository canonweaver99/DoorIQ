import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  loading?: boolean;
  error?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-200 focus-within:border-purple-400/70 focus-within:bg-purple-500/10 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <a 
    href="/testimonials"
    className={`animate-testimonial ${delay} flex items-start gap-2 xl:gap-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 p-2.5 xl:p-3 2xl:p-4 w-52 xl:w-64 2xl:w-72 hover:bg-white/15 transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)] cursor-pointer`}
  >
    <img src={testimonial.avatarSrc} className="h-8 w-8 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 object-cover rounded-lg ring-2 ring-white/20 flex-shrink-0" alt="avatar" />
    <div className="text-xs xl:text-xs 2xl:text-sm leading-tight">
      <p className="flex items-center gap-1 font-bold text-white xl:text-sm 2xl:text-base">{testimonial.name}</p>
      <p className="text-slate-300 text-xs font-medium">{testimonial.handle}</p>
      <p className="mt-0.5 xl:mt-1 text-white font-medium leading-snug xl:leading-snug 2xl:leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
    </div>
  </a>
);

// --- MAIN COMPONENT ---

export const SignInComponent: React.FC<SignInPageProps> = ({
  title,
  description,
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  loading = false,
  error = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 pt-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-4">
            <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-semibold leading-tight">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-slate-400 text-sm leading-snug">{description}</p>

            <form className="space-y-3.5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm py-3 px-3 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm py-3 px-3 pr-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={onResetPassword}
                  className="hover:underline text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Reset password
                </button>
              </div>

              {error && (
                <div className="animate-element text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-white/10"></span>
              <span className="px-4 text-sm text-slate-400 bg-transparent absolute">Or continue with</span>
            </div>

            <button
              onClick={onGoogleSignIn}
              disabled={loading}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-white/10 rounded-xl py-3 text-sm hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-slate-400">
              New to DoorIQ?{' '}
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-purple-400 hover:text-purple-300 hover:underline transition-colors font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative -ml-24">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-0 rounded-none bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07030f] via-transparent to-transparent"></div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 xl:gap-2.5 2xl:gap-3 px-2 xl:px-4 w-full justify-center z-10 max-w-[95vw] xl:max-w-full">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />}
              {testimonials[2] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
              {/* Hide 4th testimonial on laptop, only show on 2xl (large monitors) */}
              {testimonials[3] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[3]} delay="animate-delay-1600" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};


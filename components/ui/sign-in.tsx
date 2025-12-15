import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AnimatedBackground } from './animated-background';

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
    className={`animate-testimonial ${delay} group relative bg-black border-2 border-white/20 rounded-lg p-3.5 md:p-4 hover:border-white/30 transition-all duration-500 w-[200px] md:w-[220px] cursor-pointer`}
  >
    {/* Content */}
    <div className="relative z-10">
      {/* Testimonial text */}
      <p className="text-white leading-relaxed text-xs md:text-sm mb-3 font-sans font-normal">
        {testimonial.text}
      </p>
      
      {/* Author info */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/20">
        {testimonial.avatarSrc && (
          <div className="relative flex-shrink-0">
            <img
              width={36}
              height={36}
              src={testimonial.avatarSrc}
              alt={testimonial.name}
              className="h-9 w-9 rounded-full object-cover border border-white/20"
            />
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="font-medium tracking-tight leading-tight text-white text-xs md:text-sm font-space">
            {testimonial.name}
          </div>
          <div className="leading-tight text-white/80 text-xs font-sans mt-0.5">
            Sales Rep
          </div>
        </div>
      </div>
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
    <div className="min-h-screen h-[100dvh] flex flex-col md:flex-row w-full overflow-x-hidden bg-black relative">
      <AnimatedBackground />
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6 md:pt-4 pb-4 sm:pb-6 md:pb-8 overflow-y-auto relative z-10">
        <div className="w-full max-w-md px-2 sm:px-3 md:px-0">
          <div className="flex flex-col gap-3 sm:gap-4">
            <h1 className="animate-element animate-delay-100 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-space font-light tracking-tight leading-tight break-words text-white">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-white/80 text-sm sm:text-base leading-relaxed break-words hyphens-auto font-sans">{description}</p>

            <form className="space-y-3 sm:space-y-3.5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-xs sm:text-sm py-2 sm:py-2.5 md:py-3 px-3 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-xs sm:text-sm py-2 sm:py-2.5 md:py-3 px-3 pr-9 sm:pr-10 md:pr-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-2 sm:right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0 min-w-0">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox flex-shrink-0" />
                  <span className="text-slate-300 group-hover:text-white transition-colors whitespace-nowrap text-xs sm:text-sm">Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={onResetPassword}
                  className="hover:underline text-purple-400 hover:text-purple-300 transition-colors text-left sm:text-right whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
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
                className="animate-element animate-delay-600 w-full rounded-md bg-gray-200 text-gray-900 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base font-bold tracking-tight hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={onGoogleSignIn}
              disabled={loading}
              className="animate-element animate-delay-700 w-full flex items-center justify-center gap-2 sm:gap-3 border border-white/10 rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium touch-manipulation"
            >
              <GoogleIcon />
              <span className="whitespace-nowrap">Continue with Google</span>
            </button>

            <p className="animate-element animate-delay-800 text-center text-xs sm:text-sm text-slate-400 px-2 sm:px-0">
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
        <section className="hidden md:block flex-1 relative -ml-12 lg:-ml-24 overflow-hidden z-10">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-0 rounded-none bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 xl:gap-2.5 2xl:gap-3 px-2 xl:px-4 w-full justify-center z-10 max-w-[95vw] xl:max-w-full overflow-x-auto">
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


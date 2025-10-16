"use client";

import { motion, useSpring } from "framer-motion";
import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Check, Star as LucideStar } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILITY FUNCTIONS ---

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

// --- BASE UI COMPONENTS (BUTTON) ---

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// --- INTERACTIVE STARFIELD ---

function Star({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [initialPos] = useState({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
  });

  const springConfig = { stiffness: 100, damping: 15, mass: 0.1 };
  const springX = useSpring(0, springConfig);
  const springY = useSpring(0, springConfig);

  useEffect(() => {
    if (
      !containerRef.current ||
      mousePosition.x === null ||
      mousePosition.y === null
    ) {
      springX.set(0);
      springY.set(0);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const starX =
      containerRect.left +
      (parseFloat(initialPos.left) / 100) * containerRect.width;
    const starY =
      containerRect.top +
      (parseFloat(initialPos.top) / 100) * containerRect.height;

    const deltaX = mousePosition.x - starX;
    const deltaY = mousePosition.y - starY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const radius = 600; // Radius of magnetic influence

    if (distance < radius) {
      const force = 1 - distance / radius;
      const pullX = deltaX * force * 0.5;
      const pullY = deltaY * force * 0.5;
      springX.set(pullX);
      springY.set(pullY);
    } else {
      springX.set(0);
      springY.set(0);
    }
  }, [mousePosition, initialPos, containerRef, springX, springY]);

  return (
    <motion.div
      className="absolute bg-foreground rounded-full"
      style={{
        top: initialPos.top,
        left: initialPos.left,
        width: `${1 + Math.random() * 2}px`,
        height: `${1 + Math.random() * 2}px`,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration: 2 + Math.random() * 3,
        repeat: Infinity,
        delay: Math.random() * 5,
      }}
    />
  );
}

function InteractiveStarfield({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {Array.from({ length: 150 }).map((_, i) => (
        <Star
          key={`star-${i}`}
          mousePosition={mousePosition}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}

// --- PRICING COMPONENT LOGIC ---

// Interfaces
interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string | React.ReactNode;
  href: string;
  onClick?: () => void;
  isPopular?: boolean;
  hasRepSelector?: boolean;
  basePrice?: number;
  yearlyBasePrice?: number;
  repPrice?: number;
  yearlyRepPrice?: number;
  minReps?: number;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

// Context for state management
const PricingContext = createContext<{
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
}>({
  isMonthly: true,
  setIsMonthly: () => {},
});

// Main PricingSection Component
export function PricingSection({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that's right for you. All plans include our core features and support.",
}: PricingSectionProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event;
    setMousePosition({ x: clientX, y: clientY });
  };

  return (
    <PricingContext.Provider value={{ isMonthly, setIsMonthly }}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition({ x: null, y: null })}
        className="relative w-full bg-background dark:bg-neutral-950 py-8 sm:py-12"
      >
        <InteractiveStarfield
          mousePosition={mousePosition}
          containerRef={containerRef}
        />
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-2 mb-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-neutral-900 dark:text-white">
              {title}
            </h2>
            <p className="text-muted-foreground text-base whitespace-pre-line">
              {description}
            </p>
          </div>
          <PricingToggle />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 items-start gap-6">
            {plans.map((plan, index) => (
              <PricingCard key={index} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </div>
    </PricingContext.Provider>
  );
}

// Pricing Toggle Component
function PricingToggle() {
  const { isMonthly, setIsMonthly } = useContext(PricingContext);
  const monthlyBtnRef = useRef<HTMLButtonElement>(null);
  const annualBtnRef = useRef<HTMLButtonElement>(null);

  const [pillStyle, setPillStyle] = useState({});

  useEffect(() => {
    const btnRef = isMonthly ? monthlyBtnRef : annualBtnRef;
    if (btnRef.current) {
      setPillStyle({
        width: btnRef.current.offsetWidth,
        transform: `translateX(${btnRef.current.offsetLeft}px)`,
      });
    }
  }, [isMonthly]);

  const handleToggle = (monthly: boolean) => {
    if (isMonthly === monthly) return;
    setIsMonthly(monthly);
  };

  return (
    <div className="flex justify-center">
      <div className="relative flex w-fit items-center rounded-full bg-muted p-1">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-primary p-1"
          style={pillStyle}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
        <button
          ref={monthlyBtnRef}
          onClick={() => handleToggle(true)}
          className={cn(
            "relative z-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            isMonthly
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          ref={annualBtnRef}
          onClick={() => handleToggle(false)}
          className={cn(
            "relative z-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            !isMonthly
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Annual
          <span
            className={cn(
              "hidden sm:inline",
              !isMonthly ? "text-primary-foreground/80" : "",
            )}
          >
            {" "}
            (Save 20%)
          </span>
        </button>
      </div>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const { isMonthly } = useContext(PricingContext);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const minReps = plan.minReps || 0;
  const [repCount, setRepCount] = useState(minReps);

  const handleCtaClick = () => {
    // Fire celebration only for sign-up actions (not sign-in)
    const isSignUp = plan.href?.includes('/signup') || /sign up/i.test(plan.buttonText || "");
    const isSignIn = plan.href?.includes('/login') || /sign in|log in/i.test(plan.buttonText || "");
    
    if (isSignUp && !isSignIn) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#06b6d4"],
        ticks: 320,
        gravity: 1,
        decay: 0.94,
        startVelocity: 32,
      });
    }
  };

  // Calculate total price for Manager plan with reps
  const calculateTotalPrice = () => {
    // Check if price is a string (e.g., "Contact Sales")
    const priceValue = isMonthly ? plan.price : plan.yearlyPrice;
    if (isNaN(Number(priceValue))) {
      return priceValue;
    }
    
    if (!plan.hasRepSelector) {
      return Number(priceValue);
    }
    const base = isMonthly ? (plan.basePrice || 0) : (plan.yearlyBasePrice || 0);
    const perRep = isMonthly ? (plan.repPrice || 0) : (plan.yearlyRepPrice || 0);
    return base + (repCount * perRep);
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{
        y: plan.isPopular && isDesktop ? -15 : 0,
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.15,
      }}
      className={cn(
        "rounded-2xl p-6 flex flex-col relative bg-background/70 backdrop-blur-sm",
        plan.isPopular
          ? "border-2 border-primary shadow-xl"
          : "border border-border",
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <div className="bg-primary py-1 px-3 rounded-full flex items-center gap-1">
            <LucideStar className="text-primary-foreground h-3.5 w-3.5 fill-current" />
            <span className="text-primary-foreground text-xs font-semibold">
              Most Popular
            </span>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col text-center">
        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {plan.description}
        </p>
        <div className="mt-4 flex items-baseline justify-center gap-x-1">
          {typeof calculateTotalPrice() === 'number' ? (
            <>
              <span className="text-4xl font-bold tracking-tight text-foreground">
                <NumberFlow
                  value={calculateTotalPrice()}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }}
                  className="font-variant-numeric: tabular-nums"
                />
              </span>
              <span className="text-xs font-semibold leading-6 tracking-wide text-muted-foreground">
                / {plan.period}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {plan.price}
            </span>
          )}
        </div>
        {typeof calculateTotalPrice() === 'number' && (
          <p className="text-xs text-muted-foreground mt-1">
            {isMonthly ? "Billed Monthly" : "Billed Annually"}
          </p>
        )}

        {/* Rep Selector for Manager Plan */}
        {plan.hasRepSelector && (
          <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30">
            <label htmlFor={`rep-count-${index}`} className="block text-xs font-medium text-foreground mb-2">
              Number of Sales Reps
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRepCount(Math.max(minReps, repCount - 1))}
                className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                aria-label="Decrease rep count"
                disabled={repCount <= minReps}
              >
                −
              </button>
              <input
                id={`rep-count-${index}`}
                type="number"
                min={minReps}
                max="999"
                value={repCount}
                onChange={(e) => setRepCount(Math.max(minReps, Math.min(999, parseInt(e.target.value) || minReps)))}
                className="flex-1 h-8 text-center rounded-md border border-border bg-background px-2 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => setRepCount(Math.min(999, repCount + 1))}
                className="w-8 h-8 rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center font-semibold text-sm"
                aria-label="Increase rep count"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {repCount > minReps ? (
                <>
                  Base: ${isMonthly ? plan.basePrice : plan.yearlyBasePrice} + {repCount} rep{repCount !== 1 ? 's' : ''} × ${isMonthly ? plan.repPrice : plan.yearlyRepPrice}
                </>
              ) : (
                <>
                  Includes {minReps} rep{minReps !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
        )}

        <ul
          role="list"
          className="mt-4 space-y-2 text-xs leading-5 text-left text-muted-foreground"
        >
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-x-2">
              <Check
                className="h-4 w-4 flex-none text-primary mt-0.5"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          {plan.onClick ? (
            <button
              onClick={() => {
                handleCtaClick();
                plan.onClick?.();
              }}
              className={cn(
                buttonVariants({
                  variant: plan.isPopular ? "default" : "outline",
                  size: "lg",
                }),
                "w-full",
              )}
            >
              {plan.buttonText}
            </button>
          ) : (
            <Link
              href={plan.href}
              className={cn(
                buttonVariants({
                  variant: plan.isPopular ? "default" : "outline",
                  size: "lg",
                }),
                "w-full",
              )}
              onClick={handleCtaClick}
            >
              {plan.buttonText}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}



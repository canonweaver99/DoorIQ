import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DoorIQ - Transform Your Sales Team with AI Training",
  description: "Stop losing deals to untrained reps. AI-powered sales training that turns rookies into closers.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              document.documentElement.classList.remove('light');
              document.documentElement.classList.add('dark');
            })();
          `,
        }}
      />
      <div className="dark">
        {children}
      </div>
    </>
  );
}


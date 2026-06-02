import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Box, Sparkles, MoveRight, Layers, FileImage } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickCert — Design and bulk-generate certificates" },
      {
        name: "description",
        content:
          "Visually design certificate templates with placeholders, then generate single PNGs or bulk batches from CSV/Excel.",
      },
      { property: "og:title", content: "QuickCert" },
      {
        property: "og:description",
        content: "Design, populate, and bulk-generate certificate PNGs.",
      },
    ],
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && isLoggedIn()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="relative flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
        {/* Subtle background dots/grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-glow opacity-40 pointer-events-none" />

        {/* Hero Top Text */}
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-widest text-primary font-bold uppercase mb-16">
            DESIGN VISUALLY.
          </h1>

          {/* Center node graphic (abstract diagram) */}
          <div className="flex items-center justify-center my-16 opacity-90 relative">
             <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl border-t border-border hidden md:block" />
             <div className="relative z-10 bg-background/50 p-6 rounded-3xl backdrop-blur-sm border border-border shadow-sm">
                <div className="bg-primary text-primary-foreground p-6 rounded-xl shadow-lg flex items-center justify-center w-24 h-24">
                  <span className="font-display text-5xl font-bold">QC</span>
                </div>
             </div>
             
             {/* Fake nodes on the lines */}
             <div className="hidden md:flex absolute w-full max-w-3xl justify-between px-12 pointer-events-none">
                <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border text-xs font-mono font-medium text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Template</div>
                <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border text-xs font-mono font-medium text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Render</div>
             </div>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-widest text-primary font-bold uppercase mt-16">
            GENERATE INSTANTLY.
          </h1>
          
          <p className="mt-8 text-muted-foreground max-w-lg mx-auto font-medium">
            QuickCert brings automated visual editing to a new era of document generation. Pixel-perfect, fast, and scalable.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary pl-4 pr-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xl"
            >
              <span className="flex items-center justify-center bg-accent-glow text-white rounded-full p-1.5">
                 <MoveRight className="w-4 h-4" />
              </span>
              Get Started
            </Link>
          </div>
        </div>

        {/* Floating Stats Band */}
        <div className="relative z-10 mt-32 w-full max-w-5xl mx-auto flex flex-col md:flex-row bg-white rounded-[2rem] p-8 shadow-sm border border-border gap-12 md:gap-0">
           
           <div className="flex-1 flex flex-col gap-6 md:border-r border-border md:pr-12">
              <div className="flex items-center gap-2 text-foreground font-bold tracking-tight">
                 <Layers className="w-5 h-5" /> QuickCert
              </div>
              <div>
                <div className="font-display text-5xl font-bold tracking-widest mb-2">10x</div>
                <p className="text-sm font-medium text-muted-foreground">Faster generation time</p>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-6 md:pl-12 md:border-r border-border md:pr-12">
              <div className="flex items-center gap-2 text-foreground font-bold tracking-tight">
                 <FileImage className="w-5 h-5" /> Export
              </div>
              <div>
                <div className="font-display text-5xl font-bold tracking-widest mb-2">100%</div>
                <p className="text-sm font-medium text-muted-foreground">Pixel-perfect accuracy</p>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-4 justify-center md:pl-12">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                 Connect your data. Our engine aligns, understands, and bulk-generates across large CSVs instantly.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full self-start hover:bg-primary/90 transition">
                 Sign up
              </Link>
           </div>
        </div>

        {/* Lower Asymmetric Section */}
        <div className="relative z-10 mt-40 w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-end gap-16 mb-20">
           
           <div className="max-w-md">
             <h2 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight">
               Introducing Generation<br/>
               <span className="text-muted-foreground">Our smartest engine capable of </span>
               <span className="font-bold">scaling how documents output</span>
             </h2>
             <p className="mt-8 text-sm font-medium text-muted-foreground leading-relaxed max-w-sm">
               A new category of visual editor built to understand and place dynamic variables in complex, real-world templates.
             </p>
             <Link to="/templates" className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-primary/90 transition">
                <Sparkles className="w-4 h-4" /> Try Now
             </Link>
           </div>

           {/* Abstract pixel art (simplified with CSS dots) */}
           <div className="hidden lg:block absolute right-0 bottom-0 translate-x-1/4 -translate-y-1/4 w-[400px] h-[400px] opacity-20" 
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 2px, transparent 2px)",
                  backgroundSize: "16px 16px",
                  WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 60%)"
                }}
           />

           <div className="max-w-xs text-right relative z-10">
             <p className="text-sm font-medium text-muted-foreground leading-relaxed">
               The first-of-its kind hybrid system that can understand and predict text bounds in large distributed batches.
             </p>
           </div>
        </div>

        <div className="mt-12 w-full max-w-5xl mx-auto border-t border-border pt-8 text-center text-xs font-medium text-muted-foreground">
          QuickCert · Built for the modern web.
        </div>
      </main>
    </div>
  );
}

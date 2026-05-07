import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, CheckCircle } from "lucide-react";
import hcLogo from "@assets/hc-logo_1772557784017.png";
import usahLogo from "@assets/USAH-Logo_1772557803462.jpg";
import { motion, AnimatePresence } from "framer-motion";

function HouseH() {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <svg
        viewBox="0 0 20 9"
        aria-hidden="true"
        fill="currentColor"
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "0.82em",
          height: "auto",
          marginBottom: "0.05em",
        }}
      >
        <polygon points="10,0 0,9 20,9" />
      </svg>
      H
    </span>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registered, setRegistered] = useState(false);
  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      login.mutate(
        { email: form.email, password: form.password },
        {
          onError: (err) =>
            toast({ title: "Login failed", description: err.message, variant: "destructive" }),
        },
      );
    } else {
      register.mutate(
        { name: form.name, email: form.email, password: form.password },
        {
          onSuccess: () => setRegistered(true),
          onError: (err) =>
            toast({
              title: "Registration failed",
              description: err.message,
              variant: "destructive",
            }),
        },
      );
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border p-10 max-w-md w-full text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Registration submitted!</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Your registration is pending coordinator approval. You will be able to log in once your
            account has been approved.
          </p>
          <button
            onClick={() => {
              setRegistered(false);
              setMode("login");
            }}
            className="text-primary font-semibold hover:underline text-sm"
          >
            Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logos */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img src={hcLogo} alt="The Hospitality Center" className="h-10 w-auto object-contain" />
            <div className="w-px h-9 bg-border" />
            <img src={usahLogo} alt="USA Homestays" className="h-9 w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div
              className="inline-flex items-center px-6 pb-3 pt-6 rounded-full bg-primary/10 text-primary text-3xl font-black tracking-wide"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <HouseH />
              ost Family&nbsp;
              <HouseH />
              ub
            </div>
            <p className="text-muted-foreground text-sm text-center">
              A community for host families supporting international students
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              data-testid="tab-login"
              onClick={() => setMode("login")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              data-testid="tab-register"
              onClick={() => setMode("register")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === "register" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-foreground">
                    Your Name / Family Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      data-testid="input-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="e.g. The Smith Family"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  data-testid="input-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  data-testid="input-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={mode === "register" ? 6 : 1}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder={
                    mode === "register" ? "At least 6 characters" : "Enter your password"
                  }
                />
              </div>
            </div>

            {mode === "register" && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                After registering, your account will need to be approved by the coordinator before
                you can access the community.
              </p>
            )}

            <button
              data-testid="button-submit-auth"
              type="submit"
              disabled={login.isPending || register.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity mt-2"
            >
              {(login.isPending || register.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {mode === "login" ? "Sign In" : "Request Access"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

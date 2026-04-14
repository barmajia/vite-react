import { useState } from "react";
import { CustomerSignupFormData } from "@/types/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

interface CustomerSignupFormProps {
  onSubmit: (data: CustomerSignupFormData) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export function CustomerSignupForm({
  onSubmit,
  _onBack,
  loading,
}: CustomerSignupFormProps) {
  const [formData, setFormData] = useState<CustomerSignupFormData>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = {
      ...formData,
      email: (formData.email ?? "").trim().toLowerCase(),
      full_name: (formData.full_name ?? "").trim(),
      phone: (formData.phone ?? "").trim(),
      password: formData.password,
    };

    onSubmit(trimmed);
  };

  const passwordStrength = () => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const strengthLevel = passwordStrength();
  const strengthColors = [
    "bg-muted/50",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="full_name" className="text-sm font-bold ml-1">
          Full Name
        </Label>
        <div className="relative group mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
            <User className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="John Doe"
            required
            className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-bold ml-1">
          Email Address
        </Label>
        <div className="relative group mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
            <Mail className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="you@example.com"
            required
            className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-bold ml-1">
          Phone Number (Optional)
        </Label>
        <div className="relative group mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
            <Phone className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1 234 567 8900"
            className="pl-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-bold ml-1">
          Password
        </Label>
        <div className="relative group mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
            <Lock className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Min 8 characters"
            minLength={8}
            required
            className="pl-12 pr-12 h-14 glass bg-white/5 border-white/10 rounded-2xl transition-all text-lg placeholder:text-muted-foreground/20"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground/50 hover:text-primary transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {formData.password && (
          <div className="mt-3 px-1 space-y-2">
            <div className="flex gap-1.5 h-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 rounded-full transition-all duration-500 ${
                    level <= strengthLevel
                      ? strengthColors[strengthLevel]
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${strengthLevel <= 1 ? "text-red-500" : strengthLevel <= 2 ? "text-orange-500" : "text-green-500"}`}
            >
              {strengthLabels[strengthLevel]}
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full glass bg-primary hover:bg-primary/90 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            Creating Account...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            Create Customer Account
            <ArrowRight className="h-5 w-5" />
          </div>
        )}
      </Button>
    </form>
  );
}

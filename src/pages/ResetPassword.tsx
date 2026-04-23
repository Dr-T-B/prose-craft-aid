/**
 * ResetPassword.tsx
 *
 * Step 2 of the password reset flow.
 * The user lands here after clicking the link in their email.
 *
 * HOW IT WORKS:
 *  1. When Supabase sends the reset email, the link contains a special token
 *     in the URL hash (#access_token=...&type=recovery).
 *  2. The Supabase JS client automatically reads that token when this page
 *     loads and creates a temporary session — so the user is "logged in"
 *     just enough to change their password.
 *  3. We listen for the PASSWORD_RECOVERY event to confirm this happened.
 *  4. The user sets a new password → we call supabase.auth.updateUser().
 *  5. On success we redirect them to /login (or wherever you prefer).
 *
 * ⚠️  IMPORTANT — Supabase dashboard setup:
 *  Go to Authentication → URL Configuration → Redirect URLs and add:
 *    http://localhost:5173/reset-password    (for local dev)
 *    https://yourdomain.com/reset-password  (for production)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // error appears under the confirmPassword field
  });

type ResetPasswordFormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ResetPassword() {
  const navigate = useNavigate();

  // Has Supabase confirmed the recovery session is active?
  const [sessionReady, setSessionReady] = useState(false);
  // Was the reset already completed successfully?
  const [resetComplete, setResetComplete] = useState(false);
  // Toggle for show/hide password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
  });

  // -------------------------------------------------------------------------
  // Wait for Supabase to confirm the PASSWORD_RECOVERY event.
  // This fires automatically when the Supabase client detects the token in
  // the URL hash — we don't need to parse it ourselves.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // The recovery token was valid. The user now has a temporary session.
          setSessionReady(true);
        }
      }
    );

    // Clean up the listener when this component unmounts
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Handle form submission: update the password
  // -------------------------------------------------------------------------
  const onSubmit = async ({ password }: ResetPasswordFormValues) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      return;
    }

    setResetComplete(true);
    toast.success("Password updated! Redirecting you to login…");

    // Give the user a moment to read the success message, then redirect
    setTimeout(() => navigate("/auth"), 2500);
  };

  // -------------------------------------------------------------------------
  // Render: success state
  // -------------------------------------------------------------------------
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Password updated!
          </h1>
          <p className="text-muted-foreground">
            Redirecting you to login…
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: waiting for Supabase to verify the token
  // -------------------------------------------------------------------------
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-3">
          {/* Simple spinner */}
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Verifying your reset link…
          </p>
          <p className="text-xs text-muted-foreground">
            If this takes too long, your link may have expired.{" "}
            <a href="/forgot-password" className="text-primary hover:underline">
              Request a new one.
            </a>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: new password form
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose something strong — at least 8 characters, one uppercase
            letter, and one number.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-9 pr-10 py-2 rounded-md border border-input bg-background text-sm
                           placeholder:text-muted-foreground focus:outline-none focus:ring-2
                           focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              />
              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full pl-9 pr-10 py-2 rounded-md border border-input bg-background text-sm
                           placeholder:text-muted-foreground focus:outline-none focus:ring-2
                           focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm
                       font-medium hover:bg-primary/90 focus:outline-none focus:ring-2
                       focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

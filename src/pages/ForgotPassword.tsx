/**
 * ForgotPassword.tsx
 *
 * Step 1 of the password reset flow.
 * The user enters their email address. Supabase sends them a reset link.
 *
 * HOW IT WORKS:
 *  1. User fills in their email and submits.
 *  2. We call supabase.auth.resetPasswordForEmail(), which emails a magic link.
 *  3. The link points to /reset-password (our Step 2 page).
 *  4. We show a confirmation message so the user knows to check their inbox.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ForgotPassword() {
  // Track whether the email was sent so we can show a confirmation state
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
  });

  // Called when the form is valid and the user clicks "Send reset link"
  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // After the user clicks the link in their email, Supabase will redirect
      // them here. This MUST match a URL you have listed in your Supabase
      // dashboard under: Authentication → URL Configuration → Redirect URLs
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // Show the success state (we don't reveal whether the email exists in our
    // system — this prevents user enumeration attacks)
    setEmailSent(true);
  };

  // -------------------------------------------------------------------------
  // Render: success state
  // -------------------------------------------------------------------------
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your inbox
          </h1>
          <p className="text-muted-foreground">
            If that email address is registered, you'll receive a password reset
            link shortly. It may take a minute or two to arrive.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: email form
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the email you signed up with and we'll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm
                           placeholder:text-muted-foreground focus:outline-none focus:ring-2
                           focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
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
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        {/* Back link */}
        <Link
          to="/auth"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

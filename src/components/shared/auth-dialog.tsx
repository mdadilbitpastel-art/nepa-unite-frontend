"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, PasswordInput } from "@/components/shared/form-field";
import { BrandLogo, BrandWordmark } from "@/components/shared/brand-logo";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations";
import type { z } from "zod";
import { authService } from "@/services";
import { ApiError } from "@/lib/axios";
import { ROLE_HOME } from "@/lib/constants";
import { VERTICAL_TYPES, type Role } from "@/types";
import { titleCase } from "@/lib/utils";
import { useUiStore, type AuthView } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;
type ResetInput = z.infer<typeof resetPasswordSchema>;

/** Land the user after auth: staff go to their portal, buyers honor any
 *  pending callback (e.g. checkout) else stay in place. */
function useAfterAuth() {
  const router = useRouter();
  return async () => {
    const session = await getSession();
    const role = session?.user?.role as Role | undefined;
    const callbackUrl = useUiStore.getState().authCallbackUrl;
    if (role && role !== "buyer") {
      router.push(ROLE_HOME[role]);
    } else if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      router.refresh();
    }
  };
}

function LoginPanel({
  onDone,
  onForgot,
}: {
  onDone: () => void;
  onForgot: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const afterAuth = useAfterAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setLoading(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }
    onDone();
    await afterAuth();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" required error={errors.email?.message}>
        <Input
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          {...register("email")}
        />
      </Field>
      <Field label="Password" required error={errors.password?.message}>
        <PasswordInput
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgot}
          className="text-sm font-medium text-brand hover:underline"
        >
          Forgot password?
        </button>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}

function RegisterPanel({
  onDone,
  switchToLogin,
}: {
  onDone: () => void;
  switchToLogin: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const afterAuth = useAfterAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    // Storefront signup is always a buyer account.
    defaultValues: { role: "buyer", vertical_type: "retail" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setLoading(true);
    try {
      await authService.register({
        email: values.email,
        password: values.password,
        role: "buyer",
        business_name: values.business_name,
        vertical_type: values.vertical_type,
      });

      // Buyers are active immediately → auto sign-in.
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        switchToLogin();
        return;
      }
      toast.success("Welcome to NEPA Unite!");
      onDone();
      await afterAuth();
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message);
      if (err.fieldErrors?.email) toast.error(err.fieldErrors.email[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Business name" required error={errors.business_name?.message}>
          <Input placeholder="Acme Corp" {...register("business_name")} />
        </Field>

        <Field label="Industry vertical" required error={errors.vertical_type?.message}>
          <Select
            defaultValue="retail"
            onValueChange={(v) =>
              setValue("vertical_type", v as RegisterInput["vertical_type"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vertical" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {VERTICAL_TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  {titleCase(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Work email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password?.message}>
            <PasswordInput
              placeholder="Min 8 characters"
              autoComplete="new-password"
              {...register("password")}
            />
          </Field>
          <Field
            label="Confirm"
            required
            error={errors.confirm_password?.message}
          >
            <PasswordInput
              placeholder="Repeat"
              autoComplete="new-password"
              {...register("confirm_password")}
            />
          </Field>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>
    </div>
  );
}

function ForgotPanel({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotInput) => {
    setLoading(true);
    // Non-enumerable: always succeeds server-side.
    await authService.forgotPassword(values.email).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <MailCheck className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold">Check your inbox</h3>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a password
            reset link.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </button>
    </div>
  );
}

function ResetPanel({ onBack }: { onBack: () => void }) {
  const uid = useUiStore((s) => s.authResetUid);
  const token = useUiStore((s) => s.authResetToken);
  const [loading, setLoading] = useState(false);
  const missingLink = !uid || !token;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetInput) => {
    if (missingLink) return;
    setLoading(true);
    try {
      await authService.resetPassword({
        uid: uid!,
        token: token!,
        new_password: values.new_password,
      });
      toast.success("Password updated. You can now sign in.");
      onBack();
    } catch (e) {
      const err = e as ApiError;
      toast.error(err.message || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a strong new password to secure your account.
      </p>
      {missingLink && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          This reset link is missing required information. Request a new link.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="New password" required error={errors.new_password?.message}>
          <PasswordInput
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={missingLink}
            {...register("new_password")}
          />
        </Field>
        <Field
          label="Confirm password"
          required
          error={errors.confirm_password?.message}
        >
          <PasswordInput
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={missingLink}
            {...register("confirm_password")}
          />
        </Field>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={missingLink}
        >
          Reset password
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </button>
    </div>
  );
}

const VIEW_TITLE: Record<AuthView, string> = {
  login: "Sign in",
  register: "Create your account",
  forgot: "Reset your password",
  reset: "Set a new password",
};

/** Global auth popup (login / signup / forgot / reset), driven by the store. */
export function AuthDialog() {
  const open = useUiStore((s) => s.authOpen);
  const view = useUiStore((s) => s.authView);
  const setOpen = useUiStore((s) => s.setAuthOpen);
  const setView = useUiStore((s) => s.setAuthView);
  const { isAuthenticated } = useAuth();
  const close = () => setOpen(false);

  // If the session resolves to signed-in while a sign-in / sign-up popup is
  // open (e.g. it was opened during the brief auth-loading window on reload),
  // close it — showing a login form to an already-authenticated user makes no
  // sense. Forgot/reset stay open (usable while signed in, e.g. from profile).
  useEffect(() => {
    if (open && isAuthenticated && (view === "login" || view === "register")) {
      setOpen(false);
    }
  }, [open, isAuthenticated, view, setOpen]);
  const toLogin = () => setView("login");
  const isTabs = view === "login" || view === "register";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Brand header */}
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <BrandLogo colored className="size-8" />
          <BrandWordmark />
        </div>

        <DialogTitle className="sr-only">{VIEW_TITLE[view]}</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in, create an account, or reset your password on NEPA Unite.
        </DialogDescription>

        {isTabs ? (
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as AuthView)}
            className="px-6 pb-6 pt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-5">
              <LoginPanel onDone={close} onForgot={() => setView("forgot")} />
            </TabsContent>
            <TabsContent value="register" className="mt-5">
              <RegisterPanel onDone={close} switchToLogin={toLogin} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="px-6 pb-6 pt-5">
            <h3 className="mb-4 text-base font-bold tracking-tight">
              {VIEW_TITLE[view]}
            </h3>
            {view === "forgot" ? (
              <ForgotPanel onBack={toLogin} />
            ) : (
              <ResetPanel onBack={toLogin} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import type { ReactNode } from "react";

import { AppLogo } from "@/components/auth/app-logo";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

const features = [
  {
    title: "Order Management",
    description: "Track and manage all your orders in real-time",
  },
  {
    title: "Inventory Control",
    description: "Keep track of your products and stock levels",
  },
  {
    title: "Customer Insights",
    description: "Understand your customers better with analytics",
  },
  {
    title: "Multi-tenant",
    description: "Manage multiple stores from one dashboard",
  },
] as const;

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh bg-muted">
      <aside className="relative hidden flex-1 overflow-hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-center md:p-16">
        <div className="pointer-events-none absolute -top-1/2 -right-1/2 size-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -bottom-1/3 -left-1/3 size-4/5 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_0%,transparent_50%)]" />

        <div className="relative z-10 mx-auto w-full max-w-lg space-y-10">
          <AppLogo
            iconClassName="size-14 bg-black/10 backdrop-blur-sm"
            className="text-primary-foreground [&_span]:text-primary-foreground"
          />

          <div className="space-y-4">
            <h1 className="text-4xl leading-tight font-bold">
              Manage your business with ease
            </h1>
            <p className="text-lg text-primary-foreground/80">
              A powerful ecommerce platform to help you grow your online
              presence and manage orders, customers, and inventory all in one
              place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-black/10 bg-black/5 p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold">{feature.title}</p>
                <p className="mt-1 text-xs text-primary-foreground/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-xl">
          <div className="mb-8 space-y-2 text-center md:hidden">
            <AppLogo className="justify-center" />
          </div>
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

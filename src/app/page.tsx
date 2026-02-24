"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ResilienceMode = "cost" | "balanced" | "maximum";
type FailureMode = "none" | "az" | "region";

type Preset = {
  name: string;
  users: number;
  dataTB: number;
  resilience: ResilienceMode;
  failure: FailureMode;
};

const PRESETS: Preset[] = [
  { name: "Normal Day", users: 2200, dataTB: 18, resilience: "balanced", failure: "none" },
  { name: "Traffic Spike", users: 9200, dataTB: 36, resilience: "balanced", failure: "none" },
  { name: "Region Failure", users: 4800, dataTB: 24, resilience: "maximum", failure: "region" },
];

export default function Home() {
  const [users, setUsers] = useState(3200);
  const [dataTB, setDataTB] = useState(22);
  const [resilience, setResilience] = useState<ResilienceMode>("balanced");
  const [failure, setFailure] = useState<FailureMode>("none");

  const model = useMemo(() => {
    const traffic = users / 1000;
    const podBase = Math.ceil(traffic * 1.4);
    const resilienceMultiplier = resilience === "cost" ? 0.8 : resilience === "balanced" ? 1 : 1.35;
    const podCount = Math.min(20, Math.max(2, Math.round(podBase * resilienceMultiplier)));

    const activeRegion = failure === "region" ? "secondary" : "primary";
    const failover = failure !== "none";
    const degraded = failure === "az";

    const latency = Math.max(
      22,
      Math.round(32 + users / 280 + dataTB * 0.9 + (resilience === "cost" ? 16 : 0) + (degraded ? 12 : 0) + (failure === "region" ? 20 : 0))
    );

    const monthlyCost = Math.round(1800 + users * 0.28 + dataTB * 26 + podCount * 18 + (resilience === "maximum" ? 850 : 0));

    const availability = Math.max(
      95.8,
      Math.min(
        99.99,
        99.95 - (resilience === "cost" ? 0.35 : resilience === "balanced" ? 0.1 : 0.02) - (degraded ? 1.1 : 0) - (failure === "region" ? 0.2 : 0)
      )
    );

    return {
      podCount,
      latency,
      monthlyCost,
      availability,
      activeRegion,
      failover,
      degraded,
      requestFlow: Math.round(users * (failure === "none" ? 1 : 0.76)),
    };
  }, [users, dataTB, resilience, failure]);

  const applyPreset = (preset: Preset) => {
    setUsers(preset.users);
    setDataTB(preset.dataTB);
    setResilience(preset.resilience);
    setFailure(preset.failure);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Cloud Control Room</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">AWS Architecture Playground</h1>
              <p className="text-sm text-slate-400">Tune load, storage, and resilience. Watch scaling and failover behavior respond live.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[330px_1fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 text-sm font-medium text-slate-300">Controls</h2>

            <label className="mb-4 block">
              <div className="mb-1 flex justify-between text-sm">
                <span>Concurrent users</span>
                <span className="text-cyan-300">{users.toLocaleString()}</span>
              </div>
              <input type="range" min={400} max={12000} step={100} value={users} onChange={(e) => setUsers(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>

            <label className="mb-4 block">
              <div className="mb-1 flex justify-between text-sm">
                <span>Data volume (TB)</span>
                <span className="text-cyan-300">{dataTB} TB</span>
              </div>
              <input type="range" min={2} max={60} step={1} value={dataTB} onChange={(e) => setDataTB(Number(e.target.value))} className="w-full accent-violet-400" />
            </label>

            <div className="mb-4">
              <p className="mb-2 text-sm">Resilience mode</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["cost", "balanced", "maximum"] as ResilienceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setResilience(mode)}
                    className={`rounded-lg border px-2 py-2 capitalize transition ${
                      resilience === mode ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm">Failure simulation</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {([
                  ["none", "Healthy"],
                  ["az", "AZ loss"],
                  ["region", "Region loss"],
                ] as [FailureMode, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFailure(value)}
                    className={`rounded-lg border px-2 py-2 transition ${
                      failure === value ? "border-rose-400 bg-rose-500/20 text-rose-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-300">Live architecture view</h2>
                <span className={`rounded-full px-2 py-1 text-xs ${model.failover ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                  {model.failover ? "Failover active" : "Primary path active"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RegionCard name="us-east-1" active={model.activeRegion === "primary"} impaired={failure === "region"} />
                <RegionCard name="us-west-2" active={model.activeRegion === "secondary"} impaired={false} />
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Request flow through ALB → EKS pods</span>
                  <span>{model.requestFlow.toLocaleString()} req/min</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${model.failover ? "bg-amber-400" : "bg-cyan-400"}`}
                    style={{ width: `${Math.min(100, Math.round((users / 12000) * 100))}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: model.podCount }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3 w-3 rounded-full transition-all ${model.degraded && i % 5 === 0 ? "bg-rose-400/50" : "bg-cyan-300 animate-pulse"}`}
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Latency" value={`${model.latency} ms`} hint="p95 simulated" tone="cyan" />
              <MetricCard label="Monthly Cost" value={`$${model.monthlyCost.toLocaleString()}`} hint="estimated infra" tone="violet" />
              <MetricCard label="Availability" value={`${model.availability.toFixed(2)}%`} hint="rolling 30-day" tone="emerald" />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Icon({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={22} height={22} className="h-[22px] w-[22px]" />;
}

function RegionCard({ name, active, impaired }: { name: string; active: boolean; impaired: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-400 ${
        active ? "border-cyan-400/70 bg-cyan-500/10" : "border-slate-700 bg-slate-900"
      } ${impaired ? "opacity-40 saturate-0" : "opacity-100"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{name}</p>
        <span className={`text-xs ${active ? "text-cyan-300" : "text-slate-400"}`}>{active ? "Serving traffic" : "Standby"}</span>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2"><Icon src="/aws-icons/route53.svg" alt="Route53" /> Route 53 routing</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/elb.svg" alt="Elastic Load Balancing" /> Elastic Load Balancer</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/eks.svg" alt="EKS" /> EKS service mesh</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/asg.svg" alt="Auto Scaling" /> Auto Scaling workers</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/rds.svg" alt="RDS" /> Amazon RDS (Multi-AZ)</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/s3.svg" alt="S3" /> S3 object store</div>
        <div className="flex items-center gap-2"><Icon src="/aws-icons/cloudwatch.svg" alt="CloudWatch" /> CloudWatch alarms</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "cyan" | "violet" | "emerald" }) {
  const toneClass = {
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  }[tone];

  return (
    <article className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-75">{hint}</p>
    </article>
  );
}

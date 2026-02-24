"use client";

import { useMemo, useState } from "react";

type ResilienceMode = "cost" | "balanced" | "maximum";
type FailureMode = "none" | "az" | "region";
type DrMode = "cold" | "warm" | "hot";

type Preset = {
  name: string;
  users: number;
  dataTB: number;
  resilience: ResilienceMode;
  failure: FailureMode;
  drMode: DrMode;
};

const PRESETS: Preset[] = [
  { name: "Normal Day", users: 2200, dataTB: 18, resilience: "balanced", failure: "none", drMode: "warm" },
  { name: "Traffic Spike", users: 9200, dataTB: 36, resilience: "balanced", failure: "none", drMode: "hot" },
  { name: "Region Failure", users: 4800, dataTB: 24, resilience: "maximum", failure: "region", drMode: "hot" },
];

export default function Home() {
  const [users, setUsers] = useState(3200);
  const [dataTB, setDataTB] = useState(22);
  const [resilience, setResilience] = useState<ResilienceMode>("balanced");
  const [failure, setFailure] = useState<FailureMode>("none");
  const [drMode, setDrMode] = useState<DrMode>("warm");

  const model = useMemo(() => {
    const traffic = users / 1000;
    const podBase = Math.ceil(traffic * 1.5);
    const resilienceMultiplier = resilience === "cost" ? 0.8 : resilience === "balanced" ? 1 : 1.35;
    const drMultiplier = drMode === "cold" ? 0.8 : drMode === "warm" ? 1 : 1.22;
    const podCount = Math.min(24, Math.max(2, Math.round(podBase * resilienceMultiplier * drMultiplier)));

    const activeRegion = failure === "region" ? "secondary" : "primary";
    const failover = failure !== "none";
    const degraded = failure === "az";

    const rto = drMode === "cold" ? (failure === "region" ? 120 : 40) : drMode === "warm" ? (failure === "region" ? 22 : 8) : failure === "region" ? 6 : 2;
    const rpo = drMode === "cold" ? 60 : drMode === "warm" ? 10 : 1;

    const latency = Math.max(
      22,
      Math.round(30 + users / 280 + dataTB * 0.85 + (resilience === "cost" ? 16 : 0) + (degraded ? 12 : 0) + (failure === "region" ? rto / 4 : 0) - (drMode === "hot" ? 6 : 0))
    );

    const monthlyCost = Math.round(
      1800 + users * 0.28 + dataTB * 26 + podCount * 18 + (resilience === "maximum" ? 850 : 0) + (drMode === "warm" ? 450 : drMode === "hot" ? 1200 : 0)
    );

    const availability = Math.max(
      95.8,
      Math.min(
        99.99,
        99.95 - (resilience === "cost" ? 0.35 : resilience === "balanced" ? 0.1 : 0.03) - (degraded ? 1.1 : 0) - (failure === "region" ? (drMode === "hot" ? 0.12 : 0.3) : 0)
      )
    );

    const ec2Count = Math.max(2, Math.round(podCount / 2));
    const pgReaders = Math.max(2, Math.round(users / 2600) + (resilience === "maximum" ? 1 : 0));
    const mongoShards = Math.max(2, Math.round(dataTB / 10));
    const redisNodes = Math.max(2, Math.round(users / 3200) + (drMode === "hot" ? 1 : 0));

    const publicIntensity = Math.min(100, Math.max(18, Math.round((users / 12000) * 100)));
    const privateIntensity = Math.min(100, Math.max(14, Math.round(publicIntensity * 0.7)));

    return {
      podCount,
      ec2Count,
      pgReaders,
      mongoShards,
      redisNodes,
      latency,
      monthlyCost,
      availability,
      activeRegion,
      failover,
      degraded,
      publicIntensity,
      privateIntensity,
      requestFlow: Math.round(users * (failure === "none" ? 1 : 0.76)),
      rto,
      rpo,
      cloudwatchAlarms: failure === "none" ? 3 : failure === "az" ? 8 : 13,
      cloudwatchSignals: Math.round(users * 1.8),
    };
  }, [users, dataTB, resilience, failure, drMode]);

  const applyPreset = (preset: Preset) => {
    setUsers(preset.users);
    setDataTB(preset.dataTB);
    setResilience(preset.resilience);
    setFailure(preset.failure);
    setDrMode(preset.drMode);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <header className="rounded-3xl border border-slate-800/60 bg-slate-900/35 p-7 backdrop-blur-sm sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/90">Cloud Control Room</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">AWS Reference Architecture Playground</h1>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">Interactive CI/CD, ingress, data-tier, DR, and observability journey mapping.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="rounded-full border border-slate-700/80 bg-transparent px-3.5 py-1.5 text-sm text-slate-300 transition-all duration-300 hover:border-cyan-400/70 hover:bg-cyan-500/12 hover:text-cyan-100 focus-visible:border-cyan-300 focus-visible:bg-cyan-500/12 focus-visible:text-cyan-100"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-3xl border border-slate-800/60 bg-slate-900/35 p-6 sm:p-7">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/90">Controls</h2>

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
                    className={`rounded-lg border px-2.5 py-2 capitalize transition-all duration-300 ${
                      resilience === mode
                        ? "border-cyan-400/70 bg-cyan-500/12 text-cyan-100"
                        : "border-slate-700/80 bg-transparent text-slate-300 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
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
                    className={`rounded-lg border px-2.5 py-2 transition-all duration-300 ${
                      failure === value
                        ? "border-rose-400/70 bg-rose-500/12 text-rose-100"
                        : "border-slate-700/80 bg-transparent text-slate-300 hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm">DR mode switch</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["cold", "warm", "hot"] as DrMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDrMode(mode)}
                    className={`rounded-lg border px-2.5 py-2 uppercase transition-all duration-300 ${
                      drMode === mode
                        ? "border-amber-400/70 bg-amber-500/12 text-amber-100"
                        : "border-slate-700/80 bg-transparent text-slate-300 hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                RTO: <span className="text-amber-200">~{model.rto} min</span> · RPO: <span className="text-amber-200">~{model.rpo} min</span>
              </p>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-800/60 bg-slate-900/35 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/90">Live architecture view</h2>
                <span className={`rounded-full border px-2.5 py-1 text-xs ${model.failover ? "border-amber-400/50 bg-amber-500/10 text-amber-200" : "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"}`}>
                  {model.failover ? "Failover active" : "Primary path active"}
                </span>
              </div>

              <ArchitectureFlow model={model} failure={failure} drMode={drMode} />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <RegionCard name="us-east-1" active={model.activeRegion === "primary"} impaired={failure === "region"} />
                <RegionCard name="us-west-2" active={model.activeRegion === "secondary"} impaired={false} />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Latency" value={`${model.latency} ms`} hint="p95 simulated" tone="cyan" />
              <MetricCard label="Monthly Cost" value={`$${model.monthlyCost.toLocaleString()}`} hint="estimated infra" tone="violet" />
              <MetricCard label="Availability" value={`${model.availability.toFixed(2)}%`} hint="rolling 30-day" tone="emerald" />
              <MetricCard label="CloudWatch alarms" value={`${model.cloudwatchAlarms}`} hint="active thresholds" tone="amber" />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Icon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} width={22} height={22} className="h-[22px] w-[22px]" />;
}

function ArchitectureFlow({
  model,
  failure,
  drMode,
}: {
  model: {
    ec2Count: number;
    podCount: number;
    pgReaders: number;
    mongoShards: number;
    redisNodes: number;
    publicIntensity: number;
    privateIntensity: number;
    requestFlow: number;
    cloudwatchSignals: number;
  };
  failure: FailureMode;
  drMode: DrMode;
}) {
  const lineTone = failure !== "none" ? "from-amber-400/70 to-amber-300/20" : "from-cyan-400/70 to-cyan-300/20";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/35 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Live service graph · {model.requestFlow.toLocaleString()} req/min</span>
        <span>DR mode: <span className="uppercase text-amber-300">{drMode}</span></span>
      </div>

      <Lane title="CI/CD swimlane" hint="Source → Jenkins on EC2 → Build artifact/container → ECR → EKS deploy">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <ServiceNode label="Source Repo" sub="Git commit" badge="SCM" />
          <ServiceNode icon="aws-icons/asg.svg" label="Jenkins on EC2" sub="Build/test" />
          <ServiceNode label="Artifact" sub="Image/package" badge="Build" />
          <ServiceNode label="Amazon ECR" sub="Container registry" badge="ECR" />
          <ServiceNode icon="aws-icons/eks.svg" label="Deploy to EKS" sub={`${model.podCount} pods`} />
        </div>
      </Lane>

      <Lane title="Ingress and journeys" hint="Public-facing and private/internal traffic paths">
        <div className="grid gap-2 lg:grid-cols-2">
          <JourneyCard
            title="Public-facing journey"
            tone={lineTone}
            intensity={model.publicIntensity}
            nodes={[
              { icon: "aws-icons/route53.svg", label: "Route 53" },
              { icon: "aws-icons/elb.svg", label: "ALB / API Gateway" },
              { icon: "aws-icons/eks.svg", label: "Public services" },
              { icon: "aws-icons/asg.svg", label: `${model.ec2Count} worker nodes` },
            ]}
          />
          <JourneyCard
            title="Private/internal journey"
            tone="from-violet-400/70 to-violet-300/20"
            intensity={model.privateIntensity}
            nodes={[
              { label: "Internal API" },
              { icon: "aws-icons/eks.svg", label: "Internal services" },
              { icon: "aws-icons/s3.svg", label: "Data pipelines" },
              { icon: "aws-icons/cloudwatch.svg", label: "Audit/trace" },
            ]}
          />
        </div>
      </Lane>

      <Lane title="Data tier realism" hint="PostgreSQL writer/readers + MongoDB + Redis ElastiCache">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ServiceNode icon="aws-icons/rds.svg" label="PostgreSQL" sub={`1 writer + ${model.pgReaders} readers`} />
          <ServiceNode label="MongoDB store" sub={`${model.mongoShards} shard replicas`} badge="DocDB/Mongo" />
          <ServiceNode label="Redis ElastiCache" sub={`${model.redisNodes} cache nodes`} badge="Redis" />
        </div>
      </Lane>

      <Lane title="Observability lane" hint="CloudWatch metrics/logs/alarms path from platform services">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ServiceNode icon="aws-icons/eks.svg" label="App + EKS" sub="service telemetry" />
          <ServiceNode icon="aws-icons/cloudwatch.svg" label="Metrics & Logs" sub={`${model.cloudwatchSignals.toLocaleString()} signals/min`} />
          <ServiceNode icon="aws-icons/cloudwatch.svg" label="Alarms" sub={failure === "none" ? "Healthy thresholds" : "Incident thresholds tripped"} />
          <ServiceNode label="Ops Actions" sub="scale, route, recover" badge="Runbook" />
        </div>
      </Lane>
    </div>
  );
}

function Lane({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="font-medium text-slate-100">{title}</p>
        <p className="text-slate-400/90">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function ServiceNode({ icon, label, sub, badge }: { icon?: string; label: string; sub: string; badge?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/35 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-500/80">
      <div className="flex items-center gap-2">
        {icon ? <Icon src={icon} alt={label} /> : <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded bg-slate-700 px-1 text-[10px] text-slate-300">{badge ?? "AWS"}</span>}
        <p className="text-xs font-medium text-slate-200">{label}</p>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function JourneyCard({
  title,
  nodes,
  intensity,
  tone,
}: {
  title: string;
  intensity: number;
  tone: string;
  nodes: { icon?: string; label: string }[];
}) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-4">
      <p className="mb-2 text-xs font-medium text-slate-200">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {nodes.map((node) => (
          <div key={`${title}-${node.label}`} className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-2.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">{node.icon ? <Icon src={node.icon} alt={node.label} /> : <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-300" />}<span>{node.label}</span></div>
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`absolute top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r ${tone}`} style={{ left: `${i * 25 + 11}%`, width: "16%" }} />
        ))}
        {[0, 1, 2].map((i) => (
          <TrafficDot key={`j-${title}-${i}`} delay={i * 0.4} duration={Math.max(1.2, 3.3 - intensity / 42)} left={`${i * 25 + 11}%`} width="16%" tone={title.includes("Private") ? "violet" : "cyan"} />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Path intensity: <span className="text-cyan-300">{intensity}%</span></p>
    </div>
  );
}

function TrafficDot({ delay, duration, left, width, tone = "cyan" }: { delay: number; duration: number; left: string; width: string; tone?: "cyan" | "violet" }) {
  return (
    <span
      className={`traffic-dot absolute top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full ${tone === "cyan" ? "bg-cyan-300" : "bg-violet-300"}`}
      style={{ left, ["--travel" as string]: width, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    />
  );
}

function RegionCard({ name, active, impaired }: { name: string; active: boolean; impaired: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-400 ${
        active ? "border-cyan-400/70 bg-cyan-500/8" : "border-slate-700/70 bg-slate-900/30"
      } ${impaired ? "opacity-40 saturate-0" : "opacity-100"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{name}</p>
        <span className={`text-xs ${active ? "text-cyan-300" : "text-slate-400"}`}>{active ? "Serving traffic" : "Standby"}</span>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2"><Icon src="aws-icons/route53.svg" alt="Route53" /> Route 53 routing</div>
        <div className="flex items-center gap-2"><Icon src="aws-icons/elb.svg" alt="Elastic Load Balancing" /> ALB + API ingress tier</div>
        <div className="flex items-center gap-2"><Icon src="aws-icons/eks.svg" alt="EKS" /> EKS services</div>
        <div className="flex items-center gap-2"><Icon src="aws-icons/rds.svg" alt="RDS" /> PostgreSQL writer/readers</div>
        <div className="flex items-center gap-2"><Icon src="aws-icons/s3.svg" alt="S3" /> Object + backup storage</div>
        <div className="flex items-center gap-2"><Icon src="aws-icons/cloudwatch.svg" alt="CloudWatch" /> CloudWatch alarms + runbooks</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "cyan" | "violet" | "emerald" | "amber" }) {
  const toneClass = {
    cyan: "border-cyan-500/35 bg-cyan-500/6 text-cyan-100",
    violet: "border-violet-500/35 bg-violet-500/6 text-violet-100",
    emerald: "border-emerald-500/35 bg-emerald-500/6 text-emerald-100",
    amber: "border-amber-500/35 bg-amber-500/6 text-amber-100",
  }[tone];

  return (
    <article className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-75">{hint}</p>
    </article>
  );
}

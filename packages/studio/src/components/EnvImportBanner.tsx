import { useState } from "react";
import { fetchJson } from "../hooks/use-api";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface EnvConfigSummary {
  detected: boolean;
  provider: string | null;
  baseUrl: string | null;
  model: string | null;
  hasApiKey: boolean;
}

interface EnvConfigStatus {
  project: EnvConfigSummary;
  global: EnvConfigSummary;
  effectiveSource: "project" | "global" | null;
}

interface EnvImportBannerProps {
  envConfig: EnvConfigStatus;
  onImported?: () => void;
}

export function EnvImportBanner({ envConfig, onImported }: EnvImportBannerProps) {
  const [importing, setImporting] = useState<"project" | "global" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeEnvSummary = envConfig.effectiveSource === "project"
    ? envConfig.project
    : envConfig.effectiveSource === "global"
      ? envConfig.global
      : null;

  if (!activeEnvSummary?.detected) return null;

  const envLabel = envConfig.effectiveSource === "project" ? "项目 .env" : "全局 ~/.inkos/.env";

  const handleImport = async (scope: "project" | "global") => {
    setImporting(scope);
    setError(null);
    try {
      await fetchJson("/services/import-from-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      onImported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-600">
            检测到 .env 中已配置 LLM 环境变量
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {envLabel} 中包含 provider、model 等配置，但尚未导入到 Studio。是否自动导入？
          </p>
          <div className="mt-2 text-xs text-muted-foreground/70 space-y-0.5">
            {activeEnvSummary.provider && <div>Provider: <span className="font-mono text-foreground">{activeEnvSummary.provider}</span></div>}
            {activeEnvSummary.model && <div>Model: <span className="font-mono text-foreground">{activeEnvSummary.model}</span></div>}
            {activeEnvSummary.baseUrl && <div>BaseURL: <span className="font-mono text-foreground">{activeEnvSummary.baseUrl}</span></div>}
            <div>API Key: <span className="text-foreground">{activeEnvSummary.hasApiKey ? "已设置" : "未设置"}</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => handleImport(envConfig.effectiveSource ?? "project")}
            disabled={importing !== null}
          >
            {importing ? <Loader2 className="size-3 animate-spin" /> : null}
            导入 {envLabel}
          </Button>
          {envConfig.global.detected && envConfig.effectiveSource !== "global" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImport("global")}
              disabled={importing !== null}
            >
              {importing === "global" ? <Loader2 className="size-3 animate-spin" /> : null}
              导入全局 .env
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
}

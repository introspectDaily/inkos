import { useState } from "react";
import { useServiceStore } from "../store/service";
import { fetchJson } from "../hooks/use-api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { PlusIcon, TrashIcon, CheckCircle, XCircle } from "lucide-react";

const SERVICE_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "moonshot", label: "Moonshot (Kimi)" },
  { value: "minimax", label: "MiniMax" },
  { value: "bailian", label: "百炼 (通义千问)" },
  { value: "zhipu", label: "智谱 GLM" },
  { value: "siliconflow", label: "硅基流动" },
  { value: "ppio", label: "PPIO" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "ollama", label: "Ollama (本地)" },
  { value: "custom", label: "自定义端点" },
];

interface BatchTestResult {
  ok: boolean;
  testedModel: string;
  error?: string;
}

export function ModelBatchTestPanel() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [models, setModels] = useState<string[]>([""]);
  const [apiFormat, setApiFormat] = useState<"chat" | "responses">("chat");
  const [stream, setStream] = useState(false);
  const [result, setResult] = useState<BatchTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const addModel = () => setModels((prev) => [...prev, ""]);
  const removeModel = (index: number) => setModels((prev) => prev.filter((_, i) => i !== index));
  const updateModel = (index: number, value: string) =>
    setModels((prev) => prev.map((m, i) => (i === index ? value : m)));

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    // 并行测试所有非空模型
    const testPromises = models
      .filter((m) => m.trim())
      .map(async (model) => {
        const data = await fetchJson<{ results: any[]; anyPassed: boolean }>("/services/batch-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: [{
              service: provider,
              model: model.trim(),
              apiKey,
              baseUrl: provider === "custom" ? baseUrl : undefined,
              apiFormat,
              stream,
            }],
          }),
        });
        return {
          model,
          ok: data.results?.[0]?.ok ?? false,
          error: data.results?.[0]?.error,
        };
      });

    const results = await Promise.all(testPromises);

    // 只要有一个成功即可
    const passed = results.find((r) => r.ok);
    setResult({
      ok: Boolean(passed),
      testedModel: passed?.model ?? results[0]?.model ?? "",
      error: passed ? undefined : results[0]?.error,
    });
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">批量模型测试</h2>
        <p className="text-xs text-muted-foreground mt-1">
          填写服务商配置和多个模型名称，测试任意一个模型通过即可认为全部模型可用。
        </p>
      </div>

      <div className="space-y-4">
        {/* 服务商选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">服务商</label>
          <Select value={provider} onValueChange={(v) => { if (v) setProvider(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* 自定义 Base URL */}
        {provider === "custom" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        )}

        {/* API 格式和流式 */}
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API 格式</label>
            <Select value={apiFormat} onValueChange={(v) => { if (v) setApiFormat(v as "chat" | "responses"); }}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">chat</SelectItem>
                <SelectItem value="responses">responses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">流式</label>
            <Button
              variant={stream ? "default" : "outline"}
              size="sm"
              onClick={() => setStream(!stream)}
            >
              {stream ? "开启" : "关闭"}
            </Button>
          </div>
        </div>

        {/* 模型列表 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">模型列表</label>
            <Button variant="outline" size="xs" onClick={addModel}>
              <PlusIcon className="size-3" />
              添加模型
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            添加该服务商的所有模型名称，测试任意一个通过即认定全部可用
          </p>
          <div className="space-y-2">
            {models.map((model, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`模型 ${index + 1}，如 gpt-4o`}
                  value={model}
                  onChange={(e) => updateModel(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeModel(index)}
                  disabled={models.length === 1}
                >
                  <TrashIcon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 测试结果 */}
      {result && (
        <div className={`rounded-xl border p-4 ${result.ok ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-rose-500/30 bg-rose-500/[0.03]"}`}>
          <div className="flex items-center gap-2">
            {result.ok ? (
              <CheckCircle className="size-5 text-emerald-500" />
            ) : (
              <XCircle className="size-5 text-rose-500" />
            )}
            <div>
              <p className={`font-medium ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
                {result.ok ? "测试通过" : "测试失败"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.ok
                  ? `模型 "${result.testedModel}" 测试通过，当前服务商下所有 ${models.filter(m => m.trim()).length} 个模型均可使用`
                  : result.error}
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleTest}
        disabled={testing || !apiKey.trim() || models.filter((m) => m.trim()).length === 0}
      >
        {testing ? "测试中…" : "运行测试"}
      </Button>
    </div>
  );
}

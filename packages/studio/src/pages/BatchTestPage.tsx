import { ModelBatchTestPanel } from "../components/ModelBatchTestPanel";
import { ArrowLeft } from "lucide-react";

interface Nav {
  toServices: () => void;
}

export function BatchTestPage({ nav }: { nav: Nav }) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={nav.toServices}
          className="inline-flex items-center rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft size={14} />
          返回
        </button>
        <span className="text-border">/</span>
        <span className="text-foreground">批量模型测试</span>
      </div>

      <ModelBatchTestPanel />
    </div>
  );
}

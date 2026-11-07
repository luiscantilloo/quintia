"use client";

import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { ExpertoBody, ExpertoTopbar } from "@/modules/experto/components/ExpertoBody";
import { useExpertoScreen } from "@/modules/experto/hooks/useExpertoScreen";

export function ExpertoScreen() {
  const { v, session } = useExpertoScreen();

  if (!session || !v) return null;

  return (
    <>
      <style>{`
        textarea, input { font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif }
      `}</style>
      <AgentDrawerShell
        open={!!v.agentOpen}
        drawerWidth={String(v.drawerW || "460px")}
        onClose={() => v.closeAgent?.()}
        style={{
          minWidth: 0,
          fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
          color: "#0F2D3B",
          fontSize: 15,
          background: "#F7F5EF",
        }}
        drawer={
          <AgentPanel
            role={String(v.agentRole)}
            mode="drawer"
            open={!!v.agentOpen}
            initialAsk={String(v.pendingAsk || "")}
            contextLabel={String(v.agentCtx || "")}
            onClose={() => v.closeAgent?.()}
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          />
        }
        header={<ExpertoTopbar v={v} />}
      >
        <ExpertoBody v={v} />
      </AgentDrawerShell>
    </>
  );
}

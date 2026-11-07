"use client";

import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { AdminInformesContent } from "./AdminInformesContent";
import { useAdminInformesScreen } from "./useAdminInformesScreen";

export function AdminInformesScreen() {
  const { v } = useAdminInformesScreen();

  if (!v) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Informes"
      open={!!v.agentOpen}
      drawerWidth={String(v.drawerW || "480px")}
      onClose={() => (v.closeAgent as () => void)()}
      style={{
        minWidth: 0,
        fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
        color: "#0F2D3B",
        fontSize: 15,
        background: "#F7F5EF",
      }}
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          open={!!v.agentOpen}
          initialAsk={String(v.pendingAsk || "")}
          context="reports"
          contextLabel="Sobre: informes"
          onAction={v.agentAction as (action: string, payload: unknown) => void}
          onClose={() => (v.closeAgent as () => void)()}
          style={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      }
      header={
        <AdminTopbar
          active="reports"
          onOpenAgent={() => (v.openAgent as () => void)()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-[18px]">
        <AdminInformesContent v={v} />
      </div>
    </AgentDrawerShell>
  );
}

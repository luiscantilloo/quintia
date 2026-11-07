"use client";

import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { AdminMainContent } from "./AdminMainContent";
import { useAdminScreen } from "./useAdminScreen";

export function AdminScreen() {
  const { v } = useAdminScreen();

  if (!v || !v.view) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Administrador"
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
          context={String(v.view || "")}
          contextLabel={String(v.ctxLabel || "")}
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
          active={v.navActive as string}
          onOpenAgent={() => (v.openAgent as () => void)()}
          screenCode={v.dev ? (v.screenCode as string) : undefined}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-[18px]">
        <AdminMainContent v={v} />
      </div>
    </AgentDrawerShell>
  );
}

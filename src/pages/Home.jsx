import React, { useState } from "react";
import JabberNav from "@/components/jabber/JabberNav";
import JabberSection from "@/components/jabber/JabberSection";
import GridSection from "@/components/grid/GridSection";
import SettingsSection from "@/components/settings/SettingsSection";
import EnvironmentSection from "@/components/environment/EnvironmentSection";
import WorkshopSection from "@/components/workshop/WorkshopSection";
import DashboardSection from "@/components/dashboard/DashboardSection";
import ProfileSection from "@/components/profile/ProfileSection";

export default function Home() {
  const [active, setActive] = useState("jabber");
  const [pendingBuild, setPendingBuild] = useState(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JabberNav active={active} onSelect={setActive} />

      {/* Main canvas — offset for desktop sidebar */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {active === "jabber" && (
          <div className="h-screen">
            <JabberSection />
          </div>
        )}
        {active === "grid" && (
          <div className="min-h-screen">
            <GridSection />
          </div>
        )}
        {active === "env" && (
          <div className="min-h-screen">
            <EnvironmentSection pendingBuild={pendingBuild} onConsumed={() => setPendingBuild(null)} />
          </div>
        )}
        {active === "workshop" && (
          <div className="min-h-screen">
            <WorkshopSection
              onImportBuild={(payload) => {
                setPendingBuild(payload);
                setActive("env");
              }}
            />
          </div>
        )}
        {active === "dashboard" && (
          <div className="min-h-screen">
            <DashboardSection />
          </div>
        )}
        {active === "settings" && (
          <div className="min-h-screen">
            <SettingsSection />
          </div>
        )}
        {active === "profile" && (
          <div className="min-h-screen">
            <ProfileSection />
          </div>
        )}
      </main>

      {/* Sticky anchor progress bar — 1px height */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-px bg-border/40 md:left-64">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width:
              active === "jabber"
                ? "17%"
                : active === "grid"
                ? "33%"
                : active === "env"
                ? "50%"
                : active === "workshop"
                ? "67%"
                : active === "dashboard"
                ? "83%"
                : "100%",
          }}
        />
      </div>
    </div>
  );
}
import React, { useState } from "react";
import JabberNav from "@/components/jabber/JabberNav";
import JabberSection from "@/components/jabber/JabberSection";
import ConnectionSection from "@/components/jabber/ConnectionSection";
import SettingsSection from "@/components/jabber/SettingsSection";

export default function Home() {
  const [active, setActive] = useState("jabber");

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
        {active === "connection" && (
          <div className="min-h-screen">
            <ConnectionSection />
          </div>
        )}
        {active === "settings" && (
          <div className="min-h-screen">
            <SettingsSection />
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
                ? "33%"
                : active === "connection"
                ? "66%"
                : "100%",
          }}
        />
      </div>
    </div>
  );
}
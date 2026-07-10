import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import JabberNav from "@/components/jabber/JabberNav";
import JabberSection from "@/components/jabber/JabberSection";
import GridSection from "@/components/grid/GridSection";
import SettingsSection from "@/components/settings/SettingsSection";
import EnvironmentSection from "@/components/environment/EnvironmentSection";
import WorkshopSection from "@/components/workshop/WorkshopSection";
import DashboardSection from "@/components/dashboard/DashboardSection";
import StudioSection from "@/components/studio/StudioSection";
import VideoEditor from "@/components/gallery/VideoEditor";
import PhotoEditor from "@/components/gallery/PhotoEditor";
import SoundSection from "@/components/sound/SoundSection";
import { motion, AnimatePresence } from "framer-motion";

const PATH_TO_SECTION = {
  "": "jabber",
  jabber: "jabber",
  sound: "sound",
  grid: "grid",
  studio: "studio",
  "video-editor": "video-editor",
  "photo-editor": "photo-editor",
  env: "env",
  workshop: "workshop",
  dashboard: "dashboard",
  settings: "settings",
};

export default function Home({ section: sectionProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(sectionProp || "jabber");
  const [pendingBuild, setPendingBuild] = useState(null);

  // When the route changes (prop or URL), sync the active section.
  useEffect(() => {
    if (sectionProp) setActive(sectionProp);
    else {
      const seg = location.pathname.replace(/^\//, "");
      setActive(PATH_TO_SECTION[seg] || "jabber");
    }
  }, [sectionProp, location.pathname]);

  // Navigate to a route — called by the nav bar.
  const handleSelect = useCallback((id) => {
    setActive(id);
    navigate(id === "jabber" ? "/" : `/${id}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JabberNav active={active} onSelect={handleSelect} />

      {/* Main canvas — offset for desktop sidebar */}
      <main className="md:ml-64 min-h-screen pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-0">
        <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
        {active === "jabber" && (
          <div className="h-screen">
            <JabberSection />
          </div>
        )}
        {active === "sound" && (
          <div className="h-screen">
            <SoundSection />
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
                handleSelect("env");
              }}
            />
          </div>
        )}
        {active === "studio" && (
          <div className="min-h-screen">
            <StudioSection />
          </div>
        )}
        {active === "video-editor" && (
          <div className="min-h-screen">
            <VideoEditor />
          </div>
        )}
        {active === "photo-editor" && (
          <div className="min-h-screen">
            <PhotoEditor />
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
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky anchor progress bar — 1px height */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-px bg-border/40 md:left-64">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width:
              active === "jabber"
                ? "12%"
                : active === "sound"
                ? "22%"
                : active === "grid"
                ? "28%"
                : active === "studio"
                ? "42%"
                : active === "video-editor"
                ? "50%"
                : active === "photo-editor"
                ? "53%"
                : active === "env"
                ? "57%"
                : active === "workshop"
                ? "71%"
                : active === "dashboard"
                ? "85%"
                : "100%",
          }}
        />
      </div>
    </div>
  );
}
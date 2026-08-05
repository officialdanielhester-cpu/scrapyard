import React from "react";
import PaintStudio from "@/components/grid/PaintStudio";
import { PageHeader, WorkspaceShell } from "@/components/shared";

export default function GridSection() {
  return (
    <WorkspaceShell
      className="h-[calc(100dvh-4rem)] md:h-screen"
      header={<PageHeader title="The Grid" subtitle="Paint · Layer · Create" />}
    >
      <PaintStudio />
    </WorkspaceShell>
  );
}
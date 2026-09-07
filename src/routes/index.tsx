import { createFileRoute } from "@tanstack/react-router";
import { VeloxApp } from "@/components/hud/VeloxApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VeloxApp />;
}

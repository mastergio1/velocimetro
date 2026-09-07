import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export const Route = createFileRoute("/catalogo")({
  component: CatalogPage,
  head: () => ({
    meta: [{ title: "Catálogo · VELOX" }],
  }),
});

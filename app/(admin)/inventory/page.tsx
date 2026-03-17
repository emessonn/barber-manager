import { Card, CardContent } from "@/components/ui/card";

export default function InventoryPage() {
  return (
    <div className="space-y-8 p-8 md:p-12">
      <div>
        <h1 className="text-3xl font-bold">Estoque</h1>
        <p className="text-zinc-400">Controle seus produtos e materiais</p>
      </div>

      <Card className="border-zinc-700 bg-zinc-900/50">
        <CardContent className="p-8 text-center">
          <p className="text-zinc-400">
            Funcionalidade de controle de estoque em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="space-y-8 p-8 md:p-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-zinc-400">Gerencie os serviços oferecidos</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-500">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card className="border-zinc-700 bg-zinc-900/50">
        <CardContent className="p-8 text-center">
          <p className="text-zinc-400">
            Funcionalidade de CRUD de serviços em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

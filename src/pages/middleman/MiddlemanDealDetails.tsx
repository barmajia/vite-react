// Deal Details Placeholder
import { useParams } from "react-router-dom";

export function MiddlemanDealDetails() {
  const { dealId } = useParams();
  
  return (
    <div className="container mx-auto py-8 pt-20">
      <h1 className="text-2xl font-bold mb-6">Deal Details: {dealId}</h1>
      <div className="border rounded-lg p-8">
        <p className="text-muted-foreground">Deal details will be displayed here.</p>
      </div>
    </div>
  );
}

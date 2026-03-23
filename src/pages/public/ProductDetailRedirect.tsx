import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const ProductDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectProduct = async () => {
      if (!id) {
        setError("No product ID provided");
        setLoading(false);
        return;
      }

      try {
        // Check if ID is already an ASIN (short string) or UUID
        if (id.length < 20) {
          // Likely an ASIN, redirect directly
          navigate(`/products/${id}`, { replace: true });
          return;
        }

        // It's a UUID, fetch the ASIN from database
        const { data, error } = await supabase
          .from("products")
          .select("asin")
          .eq("id", id)
          .single();

        if (error || !data) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        // Redirect to the correct product URL with ASIN
        navigate(`/products/${data.asin}`, { replace: true });
      } catch (err) {
        console.error("Redirect error:", err);
        setError("Failed to load product");
        setLoading(false);
      }
    };

    redirectProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return null;
};

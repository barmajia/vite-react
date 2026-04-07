import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

const PatientConsent: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ agreed: false, signature: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Submit consent form to Supabase
      const { error } = await supabase.from("consents").insert({
        appointment_id: appointmentId,
        agreed: formData.agreed,
        signature_text: formData.signature,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Consent submitted successfully");
      navigate("/health/patient/appointments");
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Medical Consent Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-gray-50 border rounded">
          <p className="text-sm text-gray-700">
            I hereby consent to the treatment procedures associated with
            appointment #{appointmentId}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="agree"
            checked={formData.agreed}
            onChange={(e) =>
              setFormData({ ...formData, agreed: e.target.checked })
            }
            className="w-4 h-4"
            required
          />
          <label htmlFor="agree" className="text-sm">
            I agree to the terms
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Digital Signature (Type Full Name)
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={formData.signature}
            onChange={(e) =>
              setFormData({ ...formData, signature: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Submitting..." : "Submit Consent"}
        </button>
      </form>
    </div>
  );
};

export default PatientConsent;

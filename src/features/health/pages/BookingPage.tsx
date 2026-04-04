/**
 * Appointment Booking Page
 *
 * Schedule appointment with doctor
 * Route: /services/health/book/:doctorId
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";

export default function BookingPage() {
  const { t } = useTranslation();
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }

    // Pre-fill user data
    setFormData((prev) => ({
      ...prev,
      patient_name: user.user_metadata?.full_name || "",
      patient_email: user.email || "",
      patient_phone: user.user_metadata?.phone || "",
      appointment_time: searchParams.get("slot") || "",
    }));

    fetchDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, user, navigate, searchParams, t]);

  const fetchDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from("health_doctor_profiles")
        .select(
          `
          *,
          users:user_id (full_name, specialization)
        `,
        )
        .eq("id", doctorId)
        .single();

      if (error) throw error;
      if (data) setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get patient profile
      const { data: patientData } = await supabase
        .from("health_patient_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      let patientId = patientData?.id;

      // Create patient profile if doesn't exist
      if (!patientId) {
        const { data: newPatient } = await supabase
          .from("health_patient_profiles")
          .insert({
            user_id: user!.id,
          })
          .select("id")
          .single();

        patientId = newPatient?.id;
      }

      // Create appointment
      const { error } = await supabase.from("health_appointments").insert({
        doctor_id: doctorId,
        patient_id: patientId,
        scheduled_at: `${formData.appointment_date}T${formData.appointment_time}`,
        status: "pending",
        payment_status: "pending",
        notes: formData.reason,
        metadata: {
          patient_name: formData.patient_name,
          patient_email: formData.patient_email,
          patient_phone: formData.patient_phone,
        },
      });

      if (error) throw error;

      toast.success(t("health.appointmentBooked"));
      navigate("/services/health/patient/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(t("health.bookingFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Get tomorrow's date (minimum date for booking)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ServicesHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            {t("health.bookAppointment")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("health.bookAppointmentDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-2">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>{t("health.appointmentDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Patient Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-500" />
                      {t("health.patientInformation")}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patient_name">
                          {t("health.fullName")} *
                        </Label>
                        <Input
                          id="patient_name"
                          name="patient_name"
                          value={formData.patient_name}
                          onChange={handleChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient_email">
                          {t("health.email")} *
                        </Label>
                        <Input
                          id="patient_email"
                          name="patient_email"
                          type="email"
                          value={formData.patient_email}
                          onChange={handleChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient_phone">
                          {t("health.phone")} *
                        </Label>
                        <Input
                          id="patient_phone"
                          name="patient_phone"
                          value={formData.patient_phone}
                          onChange={handleChange}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      {t("health.appointmentDateTime")}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appointment_date">
                          {t("health.date")} *
                        </Label>
                        <Input
                          id="appointment_date"
                          name="appointment_date"
                          type="date"
                          value={formData.appointment_date}
                          onChange={handleChange}
                          min={minDate}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="appointment_time">
                          {t("health.time")} *
                        </Label>
                        <Input
                          id="appointment_time"
                          name="appointment_time"
                          value={formData.appointment_time}
                          onChange={handleChange}
                          placeholder="e.g., 10:00 AM"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reason & Notes */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      {t("health.reasonForVisit")}
                    </h3>

                    <div>
                      <Label htmlFor="reason">{t("health.mainReason")} *</Label>
                      <Textarea
                        id="reason"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t("health.describeSymptoms")}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">
                        {t("health.additionalNotes")}
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder={t("health.anyAdditionalInfo")}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">
                          {t("health.importantNotice")}
                        </p>
                        <p>{t("health.appointmentNotice")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? (
                      t("health.bookingAppointment")
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {t("health.confirmBooking")}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="md:col-span-1">
            <Card className="border-slate-200 dark:border-slate-800 sticky top-24">
              <CardHeader>
                <CardTitle>{t("health.bookingSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctor && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      {t("health.doctor")}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {doctor.users?.full_name}
                    </p>
                    <p className="text-sm text-emerald-600">
                      {doctor.users?.specialization}
                    </p>
                  </div>
                )}

                {formData.appointment_date && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      {t("health.date")}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(formData.appointment_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {formData.appointment_time && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      {t("health.time")}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formData.appointment_time}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {t("health.freeCancellation")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {t("health.secureBooking")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

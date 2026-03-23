import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  FileSignature, 
  User, 
  Calendar, 
  Stethoscope, 
  CheckCircle,
  AlertCircle,
  Download,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const ConsentForm = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    currentMedications: '',
    allergies: '',
    consentTreatment: false,
    consentDataProcessing: false,
    consentTelemedicine: false,
    signature: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentTreatment || !formData.consentDataProcessing || !formData.consentTelemedicine) {
      toast.error('Please accept all consent agreements to continue');
      return;
    }

    if (!formData.signature.trim()) {
      toast.error('Please provide your electronic signature');
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Submit consent form to Supabase
      // await supabase.from('health_consent_forms').insert({
      //   appointment_id: appointmentId,
      //   patient_id: user?.id,
      //   ...formData,
      //   signed_at: new Date().toISOString(),
      //   ip_address: // get from request
      // });

      toast.success('Consent form submitted successfully');
      navigate(`/services/health/book/${appointmentId}`);
    } catch (error) {
      console.error('Error submitting consent form:', error);
      toast.error('Failed to submit consent form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSignature className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Medical Consent Form</h1>
            <p className="text-muted-foreground">Electronic consent for telemedicine consultation</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            This form is protected by HIPAA compliance standards. Your information will be kept confidential and secure.
          </AlertDescription>
        </Alert>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Patient Information</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Full Name</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Medical History</h2>
              </div>
              <CardDescription>This information helps your doctor provide better care</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Existing Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  placeholder="List any chronic conditions, past surgeries, or relevant medical history"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedications">Current Medications</Label>
                <Textarea
                  id="currentMedications"
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  placeholder="List all medications you're currently taking"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="List any known allergies (medications, foods, etc.)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Consent Agreements */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Consent Agreements</h2>
              </div>
              <CardDescription>Please read and accept all agreements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentTreatment"
                  checked={formData.consentTreatment}
                  onCheckedChange={(checked) => handleCheckboxChange('consentTreatment', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consentTreatment" className="font-medium">
                    Consent to Medical Treatment
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I consent to receive medical consultation and treatment via telemedicine. I understand the benefits and risks of remote medical care.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentDataProcessing"
                  checked={formData.consentDataProcessing}
                  onCheckedChange={(checked) => handleCheckboxChange('consentDataProcessing', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consentDataProcessing" className="font-medium">
                    HIPAA Data Processing Consent
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I consent to the electronic transmission and storage of my medical information in compliance with HIPAA regulations. I understand my data is protected and will only be used for medical purposes.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentTelemedicine"
                  checked={formData.consentTelemedicine}
                  onCheckedChange={(checked) => handleCheckboxChange('consentTelemedicine', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consentTelemedicine" className="font-medium">
                    Telemedicine Technology Consent
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I understand that telemedicine involves video/audio communication and that technical issues may occur. I agree to participate to the best of my ability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Electronic Signature */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Electronic Signature</h2>
              </div>
              <CardDescription>Your legal signature for this consent form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Type Your Full Name (Legal Signature)</Label>
                <Input
                  id="signature"
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                  placeholder="Type your full legal name as signature"
                  className="font-handwriting text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  By typing your name above, you are providing a legally binding electronic signature
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Date: {format(new Date(), 'MMMM d, yyyy h:mm a')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 md:flex-none"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Consent Form
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

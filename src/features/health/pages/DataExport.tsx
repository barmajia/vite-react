import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Shield, 
  Database,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DataCategory {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastUpdated: string;
  included: boolean;
}

export const DataExport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'profile',
    'orders',
    'appointments',
    'messages',
    'consents'
  ]);

  const dataCategories: DataCategory[] = [
    {
      id: 'profile',
      name: 'Profile Information',
      description: 'Your personal information, settings, and account details',
      recordCount: 1,
      lastUpdated: new Date().toISOString(),
      included: true
    },
    {
      id: 'orders',
      name: 'Order History',
      description: 'All your product orders, invoices, and delivery information',
      recordCount: 15,
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      included: true
    },
    {
      id: 'appointments',
      name: 'Medical Appointments',
      description: 'Health consultations, doctor appointments, and prescriptions',
      recordCount: 8,
      lastUpdated: new Date(Date.now() - 172800000).toISOString(),
      included: true
    },
    {
      id: 'messages',
      name: 'Messages & Communications',
      description: 'All your conversations with sellers, doctors, and support',
      recordCount: 47,
      lastUpdated: new Date().toISOString(),
      included: true
    },
    {
      id: 'consents',
      name: 'Consent Forms',
      description: 'Signed medical consent forms and HIPAA agreements',
      recordCount: 3,
      lastUpdated: new Date(Date.now() - 604800000).toISOString(),
      included: true
    },
    {
      id: 'activity',
      name: 'Activity Logs',
      description: 'Your login history, page views, and app usage',
      recordCount: 234,
      lastUpdated: new Date().toISOString(),
      included: false
    }
  ];

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one data category');
      return;
    }

    try {
      setIsExporting(true);

      // TODO: Request data export from backend
      // This would typically be an async job that emails the user when ready
      // await supabase.functions.invoke('request-data-export', {
      //   body: {
      //     categories: selectedCategories,
      //     format: exportFormat,
      //     userId: user?.id
      //   }
      // });

      // Simulate export request
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(
        'Data export request submitted! You will receive an email when your data is ready for download.',
        {
          duration: 8000
        }
      );

      navigate('/profile');
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to request data export. Please try again.');
    } finally {
      setIsExporting(false);
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
          <Download className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Data Export</h1>
            <p className="text-muted-foreground">Download your personal data (GDPR/HIPAA compliant)</p>
          </div>
        </div>

        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Your data export will include all your personal information stored in our system. 
            The export file will be encrypted and sent to your registered email address within 24-48 hours.
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-6">
        {/* Export Format */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Export Format</h2>
            <CardDescription>Choose the file format for your data export</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                onClick={() => setExportFormat('json')}
              >
                JSON
              </Button>
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
              >
                CSV
              </Button>
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setExportFormat('pdf')}
              >
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Select Data Categories</h2>
            </div>
            <CardDescription>
              Choose which types of data you want to export ({selectedCategories.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCategories.includes(category.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => handleToggleCategory(category.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                      selectedCategories.includes(category.id)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {selectedCategories.includes(category.id) && (
                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {category.recordCount} records
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {format(new Date(category.lastUpdated), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={category.included ? 'default' : 'secondary'}>
                    {category.included ? 'Included' : 'Optional'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Important Information</h2>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                <span>Your data export will be encrypted with AES-256 encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                <span>The download link will expire after 7 days for security</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                <span>You can request a data export once every 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                <span>Medical data (HIPAA) requires additional verification</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </Button>

          <Button
            onClick={handleExport}
            disabled={isExporting || selectedCategories.length === 0}
            className="flex-1 md:flex-none"
          >
            {isExporting ? (
              'Processing Request...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Request Data Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Copy, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CODVerificationDisplayProps {
  verificationCode: string;
  orderId: string;
  expiresAt?: string;
  onCopy?: () => void;
  showInstructions?: boolean;
}

export default function CODVerificationDisplay({
  verificationCode,
  orderId,
  expiresAt,
  onCopy,
  showInstructions = true
}: CODVerificationDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(verificationCode);
    toast.success('Verification code copied to clipboard!');
    onCopy?.();
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Shield className="h-5 w-5" />
          COD Verification Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order ID */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-blue-700">Order ID</span>
          <span className="font-mono text-blue-900">
            {orderId.slice(0, 8).toUpperCase()}...
          </span>
        </div>

        {/* Verification Code Display */}
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-blue-300 shadow-sm">
          <p className="text-center text-sm text-blue-600 mb-2 font-medium">
            Your Verification Code
          </p>
          <p className="text-center text-4xl font-mono font-bold tracking-wider text-blue-600">
            {verificationCode}
          </p>
        </div>

        {/* Copy Button */}
        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Code
        </Button>

        {/* Expiry Info */}
        {expiresAt && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
            <Clock className="h-4 w-4" />
            <span>Expires: {new Date(expiresAt).toLocaleString()}</span>
          </div>
        )}

        {/* Instructions */}
        {showInstructions && (
          <div className="space-y-3">
            <SeparatorWithText text="How it works" />
            
            <div className="space-y-2">
              <InstructionStep
                number={1}
                text="Save this code safely"
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
              <InstructionStep
                number={2}
                text="Wait for delivery driver to arrive"
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
              <InstructionStep
                number={3}
                text="Pay cash amount to driver"
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
              <InstructionStep
                number={4}
                text="Share this code with the driver"
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
              <InstructionStep
                number={5}
                text="Driver verifies code - order complete!"
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <p className="font-medium mb-1">Important Security Notice:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Never share this code before receiving your order</li>
              <li>Only give the code to the official delivery driver</li>
              <li>The driver will verify this code in their app</li>
              <li>Code expires after 48 hours</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InstructionStepProps {
  number: number;
  text: string;
  icon?: React.ReactNode;
}

function InstructionStep({ number, text, icon }: InstructionStepProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-800">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold">
        {number}
      </span>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{text}</span>
    </div>
  );
}

function SeparatorWithText({ text }: { text: string }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-blue-200"></div>
      <span className="flex-shrink mx-4 text-xs text-blue-600 font-medium uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-grow border-t border-blue-200"></div>
    </div>
  );
}

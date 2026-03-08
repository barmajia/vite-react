interface CheckoutStepsProps {
  currentStep: number;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const steps = [
    { number: 1, label: 'Shipping' },
    { number: 2, label: 'Payment' },
    { number: 3, label: 'Confirmation' },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number
                ? 'border-accent bg-accent text-white'
                : 'border-border text-muted-foreground'
            }`}
          >
            {currentStep > step.number ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              step.number
            )}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              currentStep >= step.number
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-4 ${
                currentStep > step.number ? 'bg-accent' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

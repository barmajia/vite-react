import React from "react";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  featureName?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-blue-50 p-6 rounded-full mb-6">
        <Construction className="w-16 h-16 text-blue-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {featureName || "This Feature"} is Coming Soon
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        We are currently building this page. It will be available in the next
        phase of the Aurora platform.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
      >
        Go Back
      </button>
    </div>
  );
};

export default ComingSoon;

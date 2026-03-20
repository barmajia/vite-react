import React from "react";

const PharmacyList: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        💊 Pharmacies
      </h1>

      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Pharmacy Integration</h2>
        <p className="text-violet-100">
          Find nearby pharmacies and get your prescriptions filled
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're working on integrating local pharmacies so you can easily get
          your prescriptions filled.
        </p>
        <div className="text-left max-w-md mx-auto bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            What's coming:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✓ Find nearby pharmacies</li>
            <li>✓ Upload prescriptions</li>
            <li>✓ Order medications online</li>
            <li>✓ Track delivery status</li>
            <li>✓ Refill reminders</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PharmacyList;

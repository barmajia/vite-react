import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import HealthLayout from "@/features/health/layouts/HealthLayout";

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Healthcare Lazy Loads
const HealthLanding = lazy(() =>
  import("@/features/health/pages/HealthLanding").then((m) => ({
    default: m.default,
  })),
);
const DoctorList = lazy(() =>
  import("@/features/health/pages/DoctorList").then((m) => ({
    default: m.default,
  })),
);
const DoctorSignup = lazy(() =>
  import("@/features/health/pages/DoctorSignup").then((m) => ({
    default: m.default,
  })),
);
const DoctorPendingApproval = lazy(() =>
  import("@/features/health/pages/DoctorPendingApproval").then((m) => ({
    default: m.default,
  })),
);
const SignupPatient = lazy(() =>
  import("@/features/health/pages/SignupPatient").then((m) => ({
    default: m.default,
  })),
);
const PatientSignup = lazy(() =>
  import("@/features/health/pages/PatientSignup").then((m) => ({
    default: m.default,
  })),
);
const BookingPage = lazy(() =>
  import("@/features/health/pages/BookingPage").then((m) => ({
    default: m.default,
  })),
);
const PatientDashboard = lazy(() =>
  import("@/features/health/pages/PatientDashboard").then((m) => ({
    default: m.default,
  })),
);
const DoctorDashboard = lazy(() =>
  import("@/features/health/pages/DoctorDashboard").then((m) => ({
    default: m.default,
  })),
);
const AdminVerification = lazy(() =>
  import("@/features/health/pages/AdminVerification").then((m) => ({
    default: m.default,
  })),
);
const ConsultationRoom = lazy(() =>
  import("@/features/health/pages/ConsultationRoom").then((m) => ({
    default: m.default,
  })),
);
const PharmacyList = lazy(() =>
  import("@/features/health/pages/PharmacyList").then((m) => ({
    default: m.default,
  })),
);
const ConsentForm = lazy(() =>
  import("@/features/health/pages/ConsentForm").then((m) => ({
    default: m.ConsentForm,
  })),
);
const DataExport = lazy(() =>
  import("@/features/health/pages/DataExport").then((m) => ({
    default: m.DataExport,
  })),
);
const HospitalList = lazy(() =>
  import("@/features/health/pages/HospitalList").then((m) => ({
    default: m.default,
  })),
);

export const healthRoutes: RouteObject[] = [
  {
    path: "health",
    element: <HealthLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <HealthLanding />
          </Suspense>
        ),
      },
      {
        path: "doctors",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <DoctorList />
          </Suspense>
        ),
      },
      {
        path: "doctor/signup",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <DoctorSignup />
          </Suspense>
        ),
      },
      {
        path: "doctor/pending-approval",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <DoctorPendingApproval />
          </Suspense>
        ),
      },
      {
        path: "patient/signup",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <SignupPatient />
          </Suspense>
        ),
      },
      {
        path: "book/:id",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <BookingPage />
          </Suspense>
        ),
      },
      {
        path: "patient/dashboard",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <PatientDashboard />
          </Suspense>
        ),
      },
      {
        path: "doctor/dashboard",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <DoctorDashboard />
          </Suspense>
        ),
      },
      {
        path: "admin/verify",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminVerification />
          </Suspense>
        ),
      },
      {
        path: "consult/:id",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ConsultationRoom />
          </Suspense>
        ),
      },
      {
        path: "pharmacies",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <PharmacyList />
          </Suspense>
        ),
      },
      {
        path: "hospitals",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <HospitalList />
          </Suspense>
        ),
      },
      {
        path: "patient/consent/:appointmentId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ConsentForm />
          </Suspense>
        ),
      },
      {
        path: "patient/data-export",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <DataExport />
          </Suspense>
        ),
      },
    ],
  },
];

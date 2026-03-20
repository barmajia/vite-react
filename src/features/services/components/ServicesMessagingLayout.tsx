import { Outlet } from "react-router-dom";

export const ServicesMessagingLayout = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

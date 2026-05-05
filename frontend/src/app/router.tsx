import { Routes, Route } from 'react-router-dom';
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";
import { StaffLoginPage } from "@/features/auth/pages/StaffLoginPage";
import { StaffForgotPasswordPage } from "@/features/auth/pages/StaffForgotPasswordPage";
import { StaffResetPasswordPage } from "@/features/auth/pages/StaffResetPasswordPage";
import { NotFoundPage } from "@/components/common/NotFoundPage";
import { GuestOnlyRoute } from "@/app/routes/GuestOnlyRoute";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { PATHS } from '@/app/paths';

import { Navigate } from 'react-router-dom';

import { StationsPage } from "@/features/infrastructure/pages/StationsPage";
import { TrainsPage } from "@/features/infrastructure/pages/TrainsPage";
import { LinesPage } from "@/features/infrastructure/pages/LinesPage";
import { StaffPage } from "@/features/staff/pages/StaffPage";

/**
 * GLOBAL ROUTER (The Navigation Shell)
 * 
 *  A standard, simple React Router configuration. 
 */

export const AppRouter = () => {
  return (
    <Routes>
      {/*  Voyager Auth Routes */}
      <Route path={PATHS.VOYAGER.LOGIN} element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
      <Route path={PATHS.VOYAGER.REGISTER} element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
      <Route path={PATHS.VOYAGER.FORGOT} element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
      <Route path={PATHS.VOYAGER.RESET} element={<GuestOnlyRoute><ResetPasswordPage /></GuestOnlyRoute>} />
      
      {/* Staff Auth Routes */}
      <Route path={PATHS.STAFF.LOGIN} element={<GuestOnlyRoute><StaffLoginPage /></GuestOnlyRoute>} />
      <Route path={PATHS.STAFF.FORGOT} element={<GuestOnlyRoute><StaffForgotPasswordPage /></GuestOnlyRoute>} />
      <Route path={PATHS.STAFF.RESET} element={<GuestOnlyRoute><StaffResetPasswordPage /></GuestOnlyRoute>} />
      
      {/* Private Routes */}
      
        {/*Voyager routes */}
        <Route path={PATHS.VOYAGER.PROFILE} element={<ProtectedRoute allowedRoles={['VOYAGER']}><ProfilePage /></ProtectedRoute>} />
        
        {/* staff routes */}
        <Route path={PATHS.STAFF.PROFILE} element={<ProtectedRoute allowedRoles={['ADMIN','AGENT','CONTROLLER']}><ProfilePage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path={PATHS.ADMIN.STATIONS} element={<ProtectedRoute allowedRoles={['ADMIN']}><StationsPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.TRAINS} element={<ProtectedRoute allowedRoles={['ADMIN']}><TrainsPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.LINES} element={<ProtectedRoute allowedRoles={['ADMIN']}><LinesPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.STAFF} element={<ProtectedRoute allowedRoles={['ADMIN']}><StaffPage /></ProtectedRoute>} />
  
      {/* Fallback */}
      
      {// temporary until we add search route 
      }
      <Route path="/" element={<Navigate to={PATHS.VOYAGER.LOGIN} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
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
import { SchedulesPage } from "@/features/schedules/pages/SchedulesPage";
import { SearchPage } from "@/features/ticketing/pages/SearchPage";
import { SearchResultsPage } from "@/features/ticketing/pages/SearchResultsPage";
import { TicketDetailsPage } from "@/features/ticketing/pages/TicketDetailsPage";
import { MyTicketsPage } from "@/features/ticketing/pages/MyTicketsPage";
import { PaymentPspPage } from "@/features/payment/pages/PaymentPspPage";
import { PaymentSuccessPage, PaymentFailedPage } from "@/features/payment/pages/PaymentResultPages";
import { AdminCategoriesPage } from "@/features/subscriptions/pages/AdminCategoriesPage";
import { OffersPage } from "@/features/subscriptions/pages/OffersPage";
import { AgentRequestsPage } from "@/features/subscriptions/pages/AgentRequestsPage";
import { MySubscriptionsPage } from "@/features/subscriptions/pages/MySubscriptionsPage";
import { SubscriptionRequestPage } from "@/features/subscriptions/pages/SubscriptionRequestPage";
import { ROLES} from '@/features/auth/types/auth';
import { TripsPage } from '@/features/trips/pages/TripsPage';
import { AdminDashboardPage } from '@/features/dashboard/pages/AdminDashboardPage';
/**
 * GLOBAL ROUTER (The Navigation Shell)
 * 
 *  A standard, simple React Router configuration. 
 */

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Ticketing Routes */}
      <Route path={PATHS.VOYAGER.SEARCH} element={<SearchPage />} />
      <Route path={PATHS.VOYAGER.OFFERS} element={<OffersPage />} />
      <Route path={PATHS.VOYAGER.SUBSCRIPTIONS} element={<ProtectedRoute allowedRoles={[ROLES.VOYAGER]}><MySubscriptionsPage /></ProtectedRoute>} />
      <Route path={`${PATHS.VOYAGER.SUBSCRIPTION_REQUEST}/:category`} element={<SubscriptionRequestPage />} />
      <Route path={PATHS.VOYAGER.SUBSCRIPTION_REQUEST} element={<SubscriptionRequestPage />} />
      <Route path={PATHS.VOYAGER.RESULTS} element={<SearchResultsPage />} />
      <Route path={PATHS.VOYAGER.TRIP_DETAILS} element={<TicketDetailsPage />} />
      
      {/* Payment Flow */}
      <Route path={PATHS.VOYAGER.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
      <Route path={PATHS.VOYAGER.PAYMENT_FAILED} element={<PaymentFailedPage />} />
      <Route path={`${PATHS.VOYAGER.PAYMENT}/:sessionId`} element={<PaymentPspPage />} />

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
        <Route path={PATHS.VOYAGER.PROFILE} element={<ProtectedRoute allowedRoles={[ROLES.VOYAGER]}><ProfilePage /></ProtectedRoute>} />
        <Route path={PATHS.VOYAGER.TICKETS} element={<ProtectedRoute allowedRoles={[ROLES.VOYAGER]}><MyTicketsPage /></ProtectedRoute>} />
        
        {/* staff routes */}
        <Route path={PATHS.STAFF.PROFILE} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.AGENT, ROLES.CONTROLLER]}><ProfilePage /></ProtectedRoute>} />
        <Route path={PATHS.AGENT.SUBSCRIPTION_REQUESTS} element={<ProtectedRoute allowedRoles={[ROLES.AGENT]}><AgentRequestsPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path={PATHS.ADMIN.DASHBOARD} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.STATIONS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><StationsPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.TRAINS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><TrainsPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.LINES} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><LinesPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.STAFF} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><StaffPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.SCHEDULES} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><SchedulesPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.TRIPS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><TripsPage /></ProtectedRoute>} />
        <Route path={PATHS.ADMIN.SUBSCRIPTIONS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminCategoriesPage /></ProtectedRoute>} />
  
      {/* Fallback */}
      <Route path="/" element={<Navigate to={PATHS.VOYAGER.SEARCH} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
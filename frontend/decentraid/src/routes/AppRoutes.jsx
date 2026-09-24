import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ROLES } from '../utils/constants';

import Login from '../pages/Login';
import LandingRedirect from '../pages/LandingRedirect';
import AdminDashboard from '../pages/AdminDashboard';
import AdminIssuers from '../pages/AdminIssuers';
import AdminAudit from '../pages/AdminAudit';
import IssuerDashboard from '../pages/IssuerDashboard';
import IssueCredential from '../pages/IssueCredential';
import IssuerCredentials from '../pages/IssuerCredentials';
import HolderDashboard from '../pages/HolderDashboard';
import HolderRequests from '../pages/HolderRequests';
import VerifierDashboard from '../pages/VerifierDashboard';
import CreateVerificationRequest from '../pages/CreateVerificationRequest';
import VerifierRequests from '../pages/VerifierRequests';
import VerificationResult from '../pages/VerificationResult';
import CredentialDetail from '../pages/CredentialDetail';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<LandingRedirect />} />

          <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/issuers" element={<AdminIssuers />} />
            <Route path="/admin/audit" element={<AdminAudit />} />
          </Route>

          <Route element={<RoleRoute allow={[ROLES.ISSUER]} />}>
            <Route path="/issuer" element={<IssuerDashboard />} />
            <Route path="/issuer/issue" element={<IssueCredential />} />
            <Route path="/issuer/credentials" element={<IssuerCredentials />} />
          </Route>

          <Route element={<RoleRoute allow={[ROLES.HOLDER]} />}>
            <Route path="/holder" element={<HolderDashboard />} />
            <Route path="/holder/requests" element={<HolderRequests />} />
          </Route>

          <Route element={<RoleRoute allow={[ROLES.VERIFIER]} />}>
            <Route path="/verifier" element={<VerifierDashboard />} />
            <Route path="/verifier/request" element={<CreateVerificationRequest />} />
            <Route path="/verifier/requests" element={<VerifierRequests />} />
          </Route>

          {/* Shared screens. The API decides whether the record may be read. */}
          <Route path="/credentials/:credentialId" element={<CredentialDetail />} />
          <Route
            element={<RoleRoute allow={[ROLES.VERIFIER, ROLES.ADMIN]} />}
          >
            <Route path="/verification/:credentialId" element={<VerificationResult />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

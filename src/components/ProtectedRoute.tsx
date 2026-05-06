import React from 'react';
import { useAuth, Permission, UserRole } from '@/contexts/AuthContext';
import { ShieldAlert, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  roles,
  fallback
}) => {
  const { hasPermission, hasRole, user } = useAuth();

  // Check permission
  if (permission && !hasPermission(permission)) {
    return fallback || <AccessDenied type="permission" />;
  }

  // Check role
  if (roles && !hasRole(roles)) {
    return fallback || <AccessDenied type="role" />;
  }

  return <>{children}</>;
};

interface AccessDeniedProps {
  type: 'permission' | 'role';
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ type }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        {type === 'permission' ? (
          <Lock className="w-10 h-10 text-red-500" />
        ) : (
          <ShieldAlert className="w-10 h-10 text-red-500" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
      <p className="text-slate-500 max-w-md">
        {type === 'permission'
          ? "You don't have the required permission to access this feature. Please contact your administrator if you believe this is an error."
          : "Your role doesn't have access to this section. Please contact your administrator for assistance."}
      </p>
    </div>
  );
};

export default ProtectedRoute;

// Hook for conditional rendering based on permissions
export const usePermission = (permission: Permission): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Component for conditional rendering
interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// Component for role-based rendering
interface HasRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasRole: React.FC<HasRoleProps> = ({ roles, children, fallback = null }) => {
  const { hasRole } = useAuth();
  
  if (hasRole(roles)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

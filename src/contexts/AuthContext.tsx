import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'government_user' | 'government_approver' | 'rental_admin' | 'inspector' | 'fleet_manager';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  departmentName?: string;
  phone: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  phone: string;
}

export type Permission = 
  | 'view_dashboard'
  | 'manage_fleet'
  | 'view_fleet'
  | 'manage_requests'
  | 'view_requests'
  | 'approve_requests'
  | 'manage_quotations'
  | 'view_quotations'
  | 'approve_quotations'
  | 'manage_rentals'
  | 'view_rentals'
  | 'manage_inspections'
  | 'view_inspections'
  | 'manage_invoices'
  | 'view_invoices'
  | 'record_payments'
  | 'view_reports'
  | 'export_reports'
  | 'view_audit'
  | 'manage_settings'
  | 'manage_users';

// Role-based permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  government_user: [
    'view_fleet', 'manage_requests', 'view_requests'
  ],
  government_approver: [
    'view_dashboard', 'view_requests', 'approve_requests', 'view_quotations', 
    'approve_quotations'
  ],
  rental_admin: [
    'view_dashboard', 'manage_fleet', 'view_fleet', 'manage_requests', 'view_requests',
    'approve_requests', 'manage_quotations', 'view_quotations', 'approve_quotations',
    'manage_rentals', 'view_rentals', 'manage_inspections', 'view_inspections',
    'manage_invoices', 'view_invoices', 'record_payments', 'view_reports', 'export_reports',
    'view_audit', 'manage_settings', 'manage_users'
  ],
  inspector: [
    'view_dashboard', 'view_fleet', 'view_rentals', 'manage_inspections', 'view_inspections'
  ],
  fleet_manager: [
    'view_dashboard', 'view_fleet', 'view_requests', 'view_quotations', 'view_rentals',
    'view_inspections', 'manage_invoices', 'view_invoices', 'record_payments', 
    'view_reports', 'export_reports', 'view_audit'
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 3000);

        await checkSession();
        clearTimeout(timeout);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Add timeout for session check
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 2000)
      );
      
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // If database is not accessible, just set loading to false so user can access login
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (authId: string, email: string) => {
    try {
      // First try to find by auth_id
      let { data: userData, error } = await supabase
        .from('system_users')
        .select('*, department:government_departments(name)')
        .eq('auth_id', authId)
        .single();

      // If not found by auth_id, try by email and update auth_id
      if (!userData && !error) {
        const { data: userByEmail } = await supabase
          .from('system_users')
          .select('*, department:government_departments(name)')
          .eq('email', email)
          .single();

        if (userByEmail) {
          // Update the auth_id
          await supabase
            .from('system_users')
            .update({ auth_id: authId })
            .eq('id', userByEmail.id);
          
          userData = userByEmail;
        }
      }

      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          role: userData.role as UserRole,
          departmentId: userData.department_id,
          departmentName: userData.department?.name,
          phone: userData.phone,
          isActive: userData.is_active
        });
      } else if (error) {
        // If database tables don't exist, create a demo user for the session
        console.warn('Database tables not found, using demo mode');
        setUser({
          id: authId,
          email: email,
          fullName: 'Demo User',
          role: 'rental_admin' as UserRole,
          departmentId: null,
          departmentName: 'Demo Department',
          phone: '+1234567890',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Create demo user if database is not accessible
      setUser({
        id: authId,
        email: email,
        fullName: 'Demo User',
        role: 'rental_admin' as UserRole,
        departmentId: null,
        departmentName: 'Demo Department',
        phone: '+1234567890',
        isActive: true
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Demo mode: Check for demo credentials
      const demoUsers = [
        { email: 'user@transport.gov.za', role: 'government_user', name: 'Thabo Mthembu', password: 'user123' },
        { email: 'approver@transport.gov.za', role: 'government_approver', name: 'Nomsa Dlamini', password: 'approver123' },
        { email: 'admin@fleetmanager.co.za', role: 'rental_admin', name: 'Pieter van der Merwe', password: 'admin123' },
        { email: 'inspector@fleetmanager.co.za', role: 'inspector', name: 'Sipho Ndlovu', password: 'inspector123' },
        { email: 'finance@fleetmanager.co.za', role: 'fleet_manager', name: 'Anita Botha', password: 'finance123' },
      ];
      
      console.log('Trying to login with:', { email, password });
      const demoUser = demoUsers.find(u => u.email === email && u.password === password);
      console.log('Found demo user:', demoUser);
      
      if (demoUser) {
        console.log('Demo login successful for:', demoUser.email);
        // Create demo user session
        setUser({
          id: `demo-${demoUser.role}`,
          email: demoUser.email,
          fullName: demoUser.name,
          role: demoUser.role as UserRole,
          departmentId: demoUser.role.includes('government') ? 'demo-dept-1' : null,
          departmentName: demoUser.role.includes('government') ? 'Department of Transport' : undefined,
          phone: '+27 11 000 0000',
          isActive: true
        });
        return { success: true };
      }
      
      // Try database lookup for real users
      let existingUser = null;
      try {
        const { data } = await supabase
          .from('system_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();
        existingUser = data;
      } catch (dbError) {
        console.log('Database not accessible, using demo mode only');
      }

      if (!existingUser && !demoUser) {
        return { success: false, error: 'Invalid credentials. Try the demo accounts.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If auth fails, it might be because the user hasn't been created in auth yet
        // For demo purposes, we'll create the auth user
        if (error.message.includes('Invalid login credentials')) {
          // Try to sign up the user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: existingUser.full_name,
                role: existingUser.role
              }
            }
          });

          if (signUpError) {
            return { success: false, error: signUpError.message };
          }

          if (signUpData.user) {
            // Update system_users with auth_id
            await supabase
              .from('system_users')
              .update({ auth_id: signUpData.user.id })
              .eq('id', existingUser.id);

            await fetchUserProfile(signUpData.user.id, email);
            return { success: true };
          }
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, email);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Create system_users entry
        const { error: insertError } = await supabase
          .from('system_users')
          .insert({
            auth_id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            role: data.role,
            department_id: data.departmentId || null,
            phone: data.phone,
            is_active: true
          });

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        await fetchUserProfile(authData.user.id, data.email);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasPermission,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

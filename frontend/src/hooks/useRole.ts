import { useAuth } from '../features/auth/AuthProvider';
import { ROLES, isUniversityAdmin, isFaculty, isInstituteAdmin, isStudent } from '../constants/roles';

/**
 * Custom hook for role-based access control
 * Provides helper methods to check user's role
 */
export function useRole() {
    const { roleId } = useAuth();

    return {
        roleId,
        isUniversityAdmin: isUniversityAdmin(roleId),
        isFaculty: isFaculty(roleId),
        isInstituteAdmin: isInstituteAdmin(roleId),
        isStudent: isStudent(roleId),

        // Helper to check if user has any of the specified roles
        hasRole: (...allowedRoles: number[]) => roleId !== null && allowedRoles.includes(roleId),

        // Role constants for easy access
        ROLES,
    };
}

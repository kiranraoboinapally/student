// Role constants matching backend values
export const ROLES = {
    UNIVERSITY_ADMIN: 1,
    FACULTY: 2,
    INSTITUTE_ADMIN: 3,
    STUDENT: 5,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

// Role names for display
export const ROLE_NAMES: Record<RoleId, string> = {
    [ROLES.UNIVERSITY_ADMIN]: 'University Admin',
    [ROLES.FACULTY]: 'Faculty',
    [ROLES.INSTITUTE_ADMIN]: 'Institute Admin',
    [ROLES.STUDENT]: 'Student',
};

// Helper to check role
export const isUniversityAdmin = (roleId: number | null): boolean => roleId === ROLES.UNIVERSITY_ADMIN;
export const isFaculty = (roleId: number | null): boolean => roleId === ROLES.FACULTY;
export const isInstituteAdmin = (roleId: number | null): boolean => roleId === ROLES.INSTITUTE_ADMIN;
export const isStudent = (roleId: number | null): boolean => roleId === ROLES.STUDENT;

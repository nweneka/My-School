export type Role = 'superadmin' | 'admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  schoolId: string;
  role: Role;
  email: string;
  displayName: string;
  status: 'active' | 'disabled';
  admissionNo?: string;   // students
  staffId?: string;       // teachers
  classIds?: string[];    // teachers
}

export interface School {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  language: 'fr' | 'en';
  currentSession: string;
  currentTerm: 1 | 2 | 3;
  plan: 'trial' | 'active' | 'suspended';
  caWeight?: number;    // percentage, e.g. 40 — defaults to 40/60 if unset
  examWeight?: number;  // percentage, e.g. 60 — must sum to 100 with caWeight
}

export interface RosterStudent {
  admissionNo: string;
  fullName: string;
  dateOfBirth: string;
  classId: string;
  claimedByUid: string | null;
}

export interface RosterTeacher {
  staffId: string;
  fullName: string;
  subjectIds: string[];
  classIds: string[];
  claimedByUid: string | null;
  approved: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: string;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
}

export interface ResultEntry {
  id: string;
  studentAdmissionNo: string;
  classId: string;
  subjectId: string;
  session: string;
  term: 1 | 2 | 3;
  ca: number;
  exam: number;
  average: number;
  enteredByStaffId: string;
  status: 'draft' | 'submitted' | 'published';
}

export interface ClassRank {
  id: string;
  classId: string;
  term: number;
  session: string;
  admissionNo: string;
  rank: number;
  totalStudents: number;
  average: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'students' | 'teachers' | string;
  createdAt: number;
}

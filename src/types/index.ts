export interface Product {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: 'Active' | 'In-Active';
}

export interface Project {
  id: string;
  name: string;
  shortName: string;
  productShortName: string;
  description: string;
  status: 'Active' | 'In-Active';
  businessOwner: string;
  customer: string;
  poStatus: 'PO' | 'Non-PO';
  startDate: string;
  completionDate: string;
}

export interface Department {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Resource {
  id: string;
  name: string;
  designation: string;
  department: string;
  availability: 'Onshore' | 'Offshore';
  status: 'Active' | 'In-Active';
}

export interface ResourceUtilization {
  resourceId: string;
  projectId: string;
  projectName: string;
  projectShortName: string;
  utilization: number;
  dateRangeId: string;
}

export interface DateRange {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'User';
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'User';
}

export interface Settings {
  companyName: string;
  companyLogo?: string;
  theme: 'light' | 'dark';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  autoLogout: number; // minutes
}

export type NavigationTab = 'dashboard' | 'products' | 'projects' | 'resources' | 'utilization' | 'reports' | 'users' | 'settings';
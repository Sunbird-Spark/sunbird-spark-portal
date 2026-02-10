import { LocaleData } from '../types';

export const en: LocaleData = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
  },
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    invalidCredentials: 'Invalid email or password',
    loginSuccess: 'Login successful',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back',
    stats: {
      users: 'Total Users',
      sessions: 'Active Sessions',
      revenue: 'Revenue',
    },
  },
  errors: {
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    notFound: 'The requested resource was not found.',
    unauthorized: 'You are not authorized to access this resource.',
  },
};
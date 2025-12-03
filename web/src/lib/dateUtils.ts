import { format } from 'date-fns';

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM d, yyyy h:mm:ss a');
};

export const formatDateTimeShort = (date: string | Date): string => {
  return format(new Date(date), 'MMM d, h:mm:ss a');
};

export const formatDateOnly = (date: string | Date): string => {
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatTimeOnly = (date: string | Date): string => {
  return format(new Date(date), 'h:mm:ss a');
};

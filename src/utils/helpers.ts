import { CourseNode } from '../types/course';

/**
 * Generates a unique ID for a course section.
 * @param {CourseNode} courseNode - The course node object.
 * @returns {string} A unique ID (e.g., "CIT1337-1").
 */

export const getCourseId = (courseNode: CourseNode | null | undefined): string => {
  if (!courseNode || typeof courseNode.code !== 'string' || typeof courseNode.section !== 'number') {
     console.error("Invalid course node for ID generation:", courseNode);
     return `invalid-${Math.random().toString(36).substring(7)}`;
  }
  return `${courseNode.code}-${courseNode.section}`;
};

/**
 * Formats time string HH:MM:SS to HH:MM.
 * @param {string} timeString - Time string like "8:30:00".
 * @returns {string} Formatted time string like "8:30".
 */
export const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString || typeof timeString !== 'string' || timeString.length < 5) return '';
  return timeString.substring(0, 5);
};

/**
 * Gets the current day number (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat).
 * Assumes the data uses the same convention.
 * @returns {number} Current day number (0-6).
 */
export const getCurrentDay = (): number => {
    return new Date().getDay();
}

/**
 * Gets the name of the day for a given day number.
 * @param {number} dayNumber - Day number (0-6).
 * @param {string} locale - Locale string (e.g., 'en-US', 'es-ES').
 * @returns {string} Name of the day.
 */
export const getDayName = (dayNumber: number, locale: string = 'en-US'): string => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + dayNumber);
    return date.toLocaleDateString(locale, { weekday: 'long' });
}
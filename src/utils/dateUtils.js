/**
 * Date Utilities for Local Timezone Handling
 * 
 * Always use these functions instead of Date.toISOString() to ensure
 * dates are in the user's local timezone, not UTC.
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Format a Date object to YYYY-MM-DD (local timezone)
 * @param {Date} date - The date to format
 * @returns {string} Formatted date in YYYY-MM-DD format
 */
export const formatDateLocal = (date) => {
    if (!date) return getTodayLocal();
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get current date-time in YYYY-MM-DD HH:MM:SS format (local timezone)
 * @returns {string} Current date-time
 */
export const getDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get current date-time in YYYY-MM-DDTHH:mm format (local timezone)
 * Useful for <input type="datetime-local" />
 * @returns {string} Current date-time for input
 */
export const getDateTimeLocalInput = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format a Date object to DD/MM/YYYY (local timezone)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date in DD/MM/YYYY format
 */
export const formatDateDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Get start of day timestamp (local timezone)
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} Start of day (00:00:00)
 */
export const getStartOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Get end of day timestamp (local timezone)
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} End of day (23:59:59)
 */
export const getEndOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Convert local date string (YYYY-MM-DD) to ISO string for backend
 * This adds the local time offset so backend treats it as local date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} ISO string that represents the local date
 */
export const localDateToISO = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toISOString();
};

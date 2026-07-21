import axios from 'axios';

// NOTE: Since your baseURL is relative ('/reports'), ensure your Vite proxy 
// setup in vite.config.js forwards this to http://localhost:8094
const reportsApi = axios.create({
  baseURL: '/reports',
});

/**
 * Downloads the Alerts report (PDF or Excel) using the provided filters.
 * @param {Object} filters - { reportType, format, startDate, endDate }
 * @returns {Promise<Blob>} The report file blob
 */
export const downloadAlertsReport = async (filters) => {
  const response = await reportsApi.post('/alerts/download', filters, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Downloads the Telemetry report (PDF or Excel) using the provided filters.
 * @param {Object} filters - { reportType, format, startDate, endDate }
 * @returns {Promise<Blob>} The report file blob
 */
export const downloadTelemetryReport = async (filters) => {
  const response = await reportsApi.post('/telemetry/download', filters, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Utility function to trigger browser file download from a Blob with correct MIME formats.
 * @param {Blob} blob - The file content blob
 * @param {string} baseName - Base name for the file (e.g., 'telemetry_report')
 * @param {string} format - The file format extension requested ('pdf' or 'xlsx')
 */
export const triggerFileDownload = (blob, baseName, format) => {
  // 1. Determine the appropriate browser content type
  const mimeType = format.toLowerCase() === 'pdf' 
    ? 'application/pdf' 
    : 'text/csv';

  // 2. Wrap the binary stream raw data array with the specific content type
  const fileBlob = new Blob([blob], { type: mimeType });
  const url = window.URL.createObjectURL(fileBlob);
  
  // 3. Construct the clean file handle link string
  const fileName = `${baseName}_${Date.now()}.${format.toLowerCase()}`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  
  document.body.appendChild(link);
  link.click();
  
  // 4. Clean up allocated browser window memory threads
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
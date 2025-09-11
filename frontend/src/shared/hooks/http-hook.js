import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../config";

export default function useHttp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const activeHttpRequests = useRef([]);

  const sendRequest = useCallback(
    async (url, method = "GET", body = null, headers = {}) => {
      setIsLoading(true);
      setError(null);

      const httpAbortController = new AbortController();
      activeHttpRequests.current.push(httpAbortController);

      try {
        // Construct full URL with API_BASE_URL
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        console.log(`[HTTP] Making ${method} request to:`, fullUrl);
        console.log(`[HTTP] Headers:`, headers);
        if (body) {
          console.log(`[HTTP] Body:`, body);
        }

        const response = await fetch(fullUrl, {
          method,
          headers,
          body,
          signal: httpAbortController.signal,
        });

        console.log(`[HTTP] Response status:`, response.status);
        console.log(`[HTTP] Response headers:`, response.headers);

        // Safe parsing: handle empty or non-JSON responses
        const contentType = response.headers.get("content-type") || "";
        let data;
        if (response.status === 204) {
          data = {};
        } else if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // Non-JSON: read text for error messages
          const text = await response.text();
          data = { message: text || response.statusText };
        }

        console.log(`[HTTP] Response data:`, data);

        activeHttpRequests.current = activeHttpRequests.current.filter(
          (controller) => controller !== httpAbortController
        );

        if (!response.ok) {
          const errorMessage = data && data.message ? data.message : response.statusText;
          console.error(`[HTTP] Request failed with status ${response.status}:`, errorMessage);
          throw new Error(errorMessage);
        }

        setIsLoading(false);
        return data;
      } catch (error) {
        console.error(`[HTTP] Request error:`, error);
        console.error(`[HTTP] Error details:`, {
          url: url,
          method,
          headers,
          body,
          errorMessage: error.message,
          errorStack: error.stack
        });
        
        setError(error.message);
        setIsLoading(false);

        throw error;
      }
    },
    []
  );

  function clearError() {
    setError(null);
  }

  useEffect(() => {
    return () => {
      activeHttpRequests.current.forEach((abortController) =>
        abortController.abort()
      );
    };
  }, []);

  return { isLoading, error, sendRequest, clearError };
}

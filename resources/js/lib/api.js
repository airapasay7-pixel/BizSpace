import axios from 'axios';

/**
 * Same-origin Sanctum SPA client. Authentication lives in the HTTP-only session
 * cookie; the only thing JS handles is the (non-secret) XSRF token that axios
 * copies from the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export const http = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export const fetchCsrfCookie = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true });

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
    onUnauthorized = fn;
};

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error;

        // Expired CSRF token: fetch a fresh cookie and retry the request once.
        if (response?.status === 419 && config && !config.__retried) {
            config.__retried = true;
            await fetchCsrfCookie();
            return http(config);
        }

        // Session expired while using the workspace. Auth probes handle their own 401s.
        const isAuthProbe = ['/user', '/login', '/register'].includes(config?.url);
        if (response?.status === 401 && !isAuthProbe) {
            onUnauthorized();
        }

        return Promise.reject(error);
    },
);

/** Normalise any failed request into `{ message, fields }` for the UI. */
export function parseError(error, fallback = 'Something went wrong. Please try again.') {
    const response = error?.response;

    if (!response) {
        return { message: 'Could not reach the server. Check your connection and try again.', fields: {} };
    }

    if (response.status === 422) {
        const fields = Object.fromEntries(
            Object.entries(response.data?.errors ?? {}).map(([key, messages]) => [key, messages[0]]),
        );
        return { message: response.data?.message ?? 'Please fix the highlighted fields.', fields };
    }

    if (response.status === 429) {
        return { message: 'Too many attempts. Please wait a minute and try again.', fields: {} };
    }

    if (response.status === 404) {
        return { message: 'That item no longer exists.', fields: {} };
    }

    return { message: response.status >= 500 ? fallback : (response.data?.message ?? fallback), fields: {} };
}

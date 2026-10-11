import axios from 'axios';

/**
 * Same-origin Sanctum SPA client. Authentication lives in the HTTP-only session
 * cookie. The CSRF token is fetched from `/api/csrf` and sent as X-CSRF-TOKEN; the
 * XSRF-TOKEN cookie is deliberately not used, because another app on the same parent
 * domain can set a cookie with that name and shadow ours.
 */
export const http = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: false,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export async function fetchCsrfCookie() {
    const res = await http.get('/csrf');
    http.defaults.headers.common['X-CSRF-TOKEN'] = res.data.token;
}

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
            config.headers['X-CSRF-TOKEN'] = http.defaults.headers.common['X-CSRF-TOKEN'];
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

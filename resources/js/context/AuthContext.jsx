import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchCsrfCookie, http, setUnauthorizedHandler } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // The server session is the single source of truth; nothing is read from localStorage.
    useEffect(() => {
        let active = true;

        http.get('/user')
            .then((res) => active && setUser(res.data.data))
            .catch(() => active && setUser(null))
            .finally(() => active && setLoading(false));

        setUnauthorizedHandler(() => setUser(null));

        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (credentials) => {
        await fetchCsrfCookie();
        const res = await http.post('/login', credentials);
        setUser(res.data.data);
    }, []);

    const register = useCallback(async (details) => {
        await fetchCsrfCookie();
        const res = await http.post('/register', details);
        setUser(res.data.data);
    }, []);

    // beforeClear runs after the server confirmed the logout but before local state is cleared,
    // so the caller can leave the private area without the route guard bouncing to /login.
    const logout = useCallback(async (beforeClear) => {
        try {
            await http.post('/logout');
        } finally {
            beforeClear?.();
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout, setUser }),
        [user, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

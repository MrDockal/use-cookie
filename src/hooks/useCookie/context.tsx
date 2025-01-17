import { createContext, FC, useCallback, useContext, useState } from "react";
import { tryJSONparse, tryJSONStringify, isBrowser } from "../../utils/functions";

interface CookieContext {
    cookie: Record<string, any>;
    getItem: (key: string) => any;
    removeItem: (key: string) => void;
    setItem: (params: CookieSetItem) => void;
}

const CookieContext = createContext({} as CookieContext);

interface CookieProviderProps {
    withState?: boolean;
    onChange?: (cookie: Record<string, any>) => void;
}

export interface CookieSetItem {
    key: string,
    value: any,
    expireDays?: number,
    expireHours?: number,
    expire?: string,
    path?: string
}

const CookieProvider: FC<CookieProviderProps> = ({ withState = true, onChange, children }) => {

    const getCookies = useCallback(() => {
        if (!isBrowser()) return {}
        const _cookies = document.cookie.split(';');
        const cookies = {};
        _cookies.forEach(cookie => {
            const [key, value] = cookie.split("=");
            cookies[key.trim()] = tryJSONparse(value);
        });
        return cookies;
    }, [])

    const [cookie, setCookie] = useState(getCookies());


    const setItem: (params: CookieSetItem) => void = useCallback(({ key, value, expireDays, expireHours, expire, path = "/" }) => {
        if (!key) throw new Error("No key passed");
        var d = new Date();
        const oneHour = 60 * 60 * 1000;
        if (!!expireDays) {
            d.setTime(d.getTime() + (expireDays * 24 * oneHour));
        } else if (!!expireHours) {
            d.setTime(d.getTime() + (expireHours * oneHour));
        }
        const newCookie = tryJSONStringify(value)
        document.cookie = `${key.trim()}=${newCookie};expires=${expire || d.toUTCString()};path=${path}`;
        if (withState)
            setCookie(old => {
                const newCookies = { ...old, [key.trim()]: newCookie };
                if (onChange) onChange(newCookies)
                return newCookies;
            })
        else if (onChange) onChange(getCookies())
    }, [onChange, withState, getCookies])

    const getItem: (key: string) => void = useCallback(key => {
        if (!key) throw new Error("No key passed");
        if (withState)
            return cookie[key];
        else
            return getCookies()[key]
    }, [cookie, withState, getCookies])

    const removeItem: (key: string) => void = useCallback(key => {
        if (!key) throw new Error("No key passed");
        const invalidDate = "Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = `${key.trim()}= ;expires=${invalidDate};`;
        if (withState)
            setCookie(old => {
                const newCookie = { ...old };
                delete newCookie[key.trim()];
                if (onChange) onChange(newCookie)
                return newCookie;
            })
        else if (onChange) onChange(getCookies())
    }, [onChange, withState, getCookies])

    return (
        <CookieContext.Provider value={{
            cookie,
            getItem,
            setItem,
            removeItem
        }}>
            {children}
        </CookieContext.Provider>
    )
}

export const useCookieContext = () => {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useCookieContext must be used within an CookieContext.Provider');
    }
    return context;
};

export default CookieProvider;

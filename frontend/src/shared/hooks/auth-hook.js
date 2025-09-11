import { useState, useCallback, useEffect } from "react";

let logoutTimer;

export default function useAuth() {
  const [token, setToken] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tokenExpDate, setTokenExpDate] = useState(null);

  const login = useCallback((userId, token, expDate) => {
    const tokenExpDate =
      expDate || new Date(new Date().getTime() + 1000 * 60 * 60);

    setToken(token);
    setUserId(userId);
    setTokenExpDate(tokenExpDate);

    localStorage.setItem(
      "user",
      JSON.stringify({
        userId,
        token,
        expiration: tokenExpDate.toISOString(),
      })
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setTokenExpDate(null);

    localStorage.removeItem("user");
  }, []);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("user"));

    const tokenExpirationDate = data && new Date(data.expiration).getTime();
    const now = new Date().getTime();

    // Validate that the stored userId is a valid MongoDB ObjectId
    const isValidMongoId = (maybeId) =>
      typeof maybeId === "string" && /^[0-9a-fA-F]{24}$/.test(maybeId);

    if (data && data.token && tokenExpirationDate > now && isValidMongoId(data.userId)) {
      login(data.userId, data.token);
    } else if (data && !isValidMongoId(data.userId)) {
      // Clean up stale/invalid stored auth to avoid 404 on profile
      localStorage.removeItem("user");
    }
  }, [login]);

  useEffect(() => {
    if (token && tokenExpDate) {
      const remainingTime = tokenExpDate.getTime() - new Date().getTime();

      logoutTimer = setTimeout(logout, remainingTime);
    } else {
      clearTimeout(logoutTimer);
    }
  }, [token, logout, tokenExpDate]);

  return { userId, token, login, logout };
}

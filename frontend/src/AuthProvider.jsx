import { use, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router";
import { checkTokenExpired, getMe } from "./api/requests";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storagedUser = localStorage.getItem('user');
    const storagedToken = localStorage.getItem('token');
    if (storagedToken) {
      checkTokenExpired().then((data) => {
        if (!data) {
          localStorage.setItem("user", null);
          localStorage.setItem("token", null);
          setIsLoading(false);
          setUser(false);
          return;
        }
        if (user) {
          setIsLoading(false);
        }
        if (!user) {
          if (storagedUser) {
            setUser(JSON.parse(storagedUser));
            setIsLoading(false);
          } else if (storagedToken) {
            getMe()
              .then((meResult) => {
                const user = meResult.data;
                localStorage.setItem("user", JSON.stringify(user));
                setUser(user);
                setIsLoading(false);
              });
          } else {
            setUser(null)
            setIsLoading(false);
          }
        }
      })
    } else {
      setUser(null)
      setIsLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
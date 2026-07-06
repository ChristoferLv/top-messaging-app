import { use, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router";
import { getMe } from "./api/requests";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storagedUser = localStorage.getItem('user');
    const storagedToken = localStorage.getItem('token');
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
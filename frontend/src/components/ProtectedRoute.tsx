import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokens, isTokenExpired, clearTokens, startTokenRefresh } from "../utils/api";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const { accessToken } = getTokens();

            if (!accessToken) {
                navigate("/login");
                return;
            }

            // Check if access token is expired
            if (isTokenExpired(accessToken)) {
                // Try to refresh the token
                // If refresh fails, redirect to login
                clearTokens();
                navigate("/login");
                return;
            }

            // Start auto-refresh mechanism for authenticated users
            startTokenRefresh();

            setIsAuthenticated(true);
            setLoading(false);
        };

        checkAuth();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;

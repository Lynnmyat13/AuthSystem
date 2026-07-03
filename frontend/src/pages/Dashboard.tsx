import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { authAPI, stopTokenRefresh, setTokens, startTokenRefresh } from "../utils/api";
import { toast } from "sonner";

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for Google OAuth redirect parameters
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (token && userParam) {
            // Handle Google OAuth success
            try {
                const userData = JSON.parse(decodeURIComponent(userParam));
                setTokens(token);
                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
                startTokenRefresh();
                toast.success("Successfully logged in with Google!");

                // Clean up URL parameters
                navigate('/dashboard', { replace: true });
            } catch (error) {
                console.error("Error parsing Google OAuth data:", error);
                toast.error("Error processing Google login");
                navigate('/login');
            }
        } else {
            // Regular dashboard load
            const userData = localStorage.getItem("user");
            if (userData) {
                setUser(JSON.parse(userData));
            } else {
                // No user data, redirect to login
                navigate('/login');
            }
        }
    }, [searchParams, navigate]);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            // Call logout API to revoke token on server
            await authAPI.logout();

            // Stop auto-refresh mechanism
            stopTokenRefresh();

            // Clear all local storage
            localStorage.clear();

            toast.success("Logged out successfully");
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            // Even if API call fails, clear local data
            stopTokenRefresh();
            localStorage.clear();
            navigate("/");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                AuthSystem
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome, {user?.name || "User"}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200 disabled:opacity-50"
                            >
                                {isLoading ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to your Dashboard! 🎉
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            You have successfully authenticated and are now logged into your secure account.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                                    <p className="text-2xl font-bold text-gray-900">Verified</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Security Level</p>
                                    <p className="text-2xl font-bold text-gray-900">High</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Session Active</p>
                                    <p className="text-2xl font-bold text-gray-900">Now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <p className="text-lg text-gray-900">{user?.name || "Not available"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <p className="text-lg text-gray-900">{user?.email || "Not available"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="text-center">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/"
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                Back to Home
                            </Link>
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="px-8 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Logging out..." : "Sign Out"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

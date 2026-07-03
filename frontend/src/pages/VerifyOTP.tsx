import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI, setTokens, startTokenRefresh } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const email = localStorage.getItem("verifiedEmail");
            if (!email) {
                toast.error("No email found. Please login again.");
                navigate("/login");
                return;
            }

            const response = await authAPI.verifyOTPAndLogin(email, otp);
            const { accessToken, user } = response.data;

            // Store only access token in localStorage
            setTokens(accessToken);

            // Start auto-refresh mechanism
            startTokenRefresh();

            // Store user info
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.removeItem("verifiedEmail");
            localStorage.removeItem("password"); // Clean up temporary password

            toast.success("Login successful! Welcome back!");
            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            AuthSystem
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Verify your identity
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We've sent a verification code to your email
                    </p>
                </div>

                {/* OTP Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-center text-lg tracking-widest"
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                            />
                            <p className="mt-2 text-xs text-gray-500 text-center">
                                Check your email for the verification code
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </div>
                            ) : (
                                "Verify Code"
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Need help?</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                            >
                                ← Back to login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}


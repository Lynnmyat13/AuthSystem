/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { authAPI } from "../utils/api";
import { toast } from "sonner";

export default function CaptchaPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = (location.state || {}) as { email?: string; password?: string };
    const email = state.email || "";
    const password = state.password || "";

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);

    const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) || "";

    if (!email || !password) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="p-6 bg-white rounded shadow text-center">
                    <p className="mb-4">Missing credentials — please start from the login page.</p>
                    <Link to="/login" className="text-blue-600 underline">Back to login</Link>
                </div>
            </div>
        );
    }

    const handleVerify = async () => {
        if (!siteKey) {
            toast("reCAPTCHA is not configured on the client.");
            return;
        }

        // If token isn't present try to read it from the widget (useful if user completed it but state didn't update)
        const token = captchaToken || recaptchaRef.current?.getValue() || null;

        if (!token) {
            toast("Please complete the reCAPTCHA");
            return;
        }

        setIsLoading(true);
        try {
            // Log token for debugging (remove in production)
            console.debug("reCAPTCHA token:", token);

            const res = await authAPI.login(email, password, token);
            toast(res.data.message || "OTP has been sent to your email.");
            localStorage.setItem("verifiedEmail", email);
            navigate("/verify-otp");
        } catch (err: any) {
            // If verification failed on the server, reset the widget so user can try again
            try {
                recaptchaRef.current?.reset();
            } catch { }
            setCaptchaToken(null);
            toast(err.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full space-y-8 bg-white/80 p-8 rounded-2xl shadow">
                <h2 className="text-2xl font-semibold text-center">Verify you're human</h2>
                <p className="text-sm text-gray-600 text-center">Complete the reCAPTCHA to continue signing in as <strong>{email}</strong>.</p>

                <div className="mt-6 flex flex-col items-center">
                    {siteKey ? (
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={siteKey}
                            onChange={(token) => setCaptchaToken(token)}
                            onExpired={() => {
                                setCaptchaToken(null);
                                // optional: show a small message to user
                                toast("reCAPTCHA expired, please complete it again.");
                            }}
                        />
                    ) : (
                        <div className="text-sm text-red-600 p-2 border border-red-100 rounded">
                            reCAPTCHA is not configured. Add <code>VITE_RECAPTCHA_SITE_KEY</code> to your frontend <code>.env</code> and restart the dev server.
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={isLoading || !siteKey || !captchaToken}
                        className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading ? "Processing..." : "Continue"}
                    </button>

                    <Link to="/login" className="mt-3 text-sm text-gray-600 underline">Back to login</Link>
                </div>
            </div>
        </div>
    );
}

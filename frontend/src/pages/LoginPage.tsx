import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Lock, Mail, ArrowRight, ShieldCheck, Key, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // First-time login password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  // Forgot Password Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOldPass, setForgotOldPass] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [receivedOtpHint, setReceivedOtpHint] = useState<string | null>(null);

  // Google OAuth modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Standard Login Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.isFirstLogin) {
        setMustChangePassword(true);
      } else {
        // Automatic refresh on login as requested
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Execute
  const handleGoogleLogin = async (selectedEmail: string, fullName?: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle(selectedEmail, fullName);
      setIsGoogleModalOpen(false);
      // Automatic refresh on login as requested
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
      setIsGoogleModalOpen(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle First Login Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.changePassword(password, newPassword);
      setChangePassSuccess(true);
      setTimeout(() => {
        setMustChangePassword(false);
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 - Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError('Please enter a valid email address');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setForgotError('Please enter a valid email address format (e.g. name@gmail.com)');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.sendForgotPasswordOtp(trimmedEmail);
      setForgotSuccess(res.message || 'OTP sent successfully to your registered email!');
      if (res.otp) {
        setReceivedOtpHint(res.otp);
      }
      setForgotStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'This email does not exist in our system.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP & Reset Password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('New passwords do not match');
      return;
    }

    if (forgotNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.verifyAndResetPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        oldPassword: forgotOldPass.trim() || undefined,
        newPassword: forgotNewPass.trim(),
      });
      setForgotSuccess(res || 'Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setEmail(forgotEmail.trim());
        setPassword('');
        setForgotError('');
        setForgotSuccess('');
        setReceivedOtpHint(null);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to reset password. Please check your OTP and details.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F7F3FF] via-[#FDFCFF] to-[#FFF5F9]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-modal border border-border-custom p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            T
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">TeamCRM</h1>
          <p className="text-sm text-text-secondary mt-1">
            CRM + Tasks + Server Time Tracking + API Handoff
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* First Login Mandatory Change Password Form */}
        {mustChangePassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <span className="font-bold">First Login Notice:</span> Your account was created with a temporary password. You must set a new permanent password to continue.
            </div>

            {changePassSuccess && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                Password updated successfully! Redirecting...
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                New Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-4 py-2.5 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : 'Set Password & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="w-full pl-9 pr-4 py-2.5 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-text-primary">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotStep(1);
                    setForgotError('');
                    setForgotSuccess('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-custom"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-text-secondary">or</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 shadow-xs transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-border-custom flex items-center justify-center gap-1.5 text-xs text-text-secondary">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Enterprise End-to-End Encrypted Session</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-modal border border-border-custom max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 text-primary rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Forgot Password</h3>
                <p className="text-xs text-text-secondary">
                  {forgotStep === 1 ? 'Verify your registered Google / corporate email' : 'Enter OTP & set your new password'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Registered Email Address (@gmail.com)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. rahaamalhotra@gmail.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    We will send a 6-digit verification OTP code to your registered email.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Verifying & Sending OTP...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="space-y-3.5">
                {receivedOtpHint && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex justify-between items-center">
                    <span>Generated OTP for {forgotEmail}:</span>
                    <span className="font-mono font-bold tracking-widest text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-900">
                      {receivedOtpHint}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    6-Digit Verification OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full px-3 py-2 bg-purple-50 text-sm font-mono tracking-widest text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Old Password <span className="text-[10px] text-text-secondary font-normal">(Leave blank if forgotten)</span>
                  </label>
                  <input
                    type="password"
                    value={forgotOldPass}
                    onChange={(e) => setForgotOldPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-purple-50 text-sm text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-primary hover:underline"
                  >
                    ← Back to Email
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google OAuth Account Picker Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-modal border border-border-custom max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsGoogleModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <svg className="w-7 h-7 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <h3 className="text-base font-bold text-text-primary">Sign in with Google</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Choose an account to continue to TeamCRM
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleLogin('payaldjadhao@gmail.com', 'Payal Jadhao')}
                className="w-full p-2.5 flex items-center justify-between text-left bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 rounded-xl transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-text-primary">Payal Jadhao (Admin)</div>
                  <div className="text-[11px] text-text-secondary">payaldjadhao@gmail.com</div>
                </div>
                <span className="text-[10px] bg-purple-200/80 text-primary font-semibold px-2 py-0.5 rounded">
                  Admin
                </span>
              </button>

              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleLogin('jayshreejadhao0206@gmail.com', 'Jayshree Jadhao')}
                className="w-full p-2.5 flex items-center justify-between text-left bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 rounded-xl transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-text-primary">Jayshree Jadhao (Manager)</div>
                  <div className="text-[11px] text-text-secondary">jayshreejadhao0206@gmail.com</div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                  Manager
                </span>
              </button>

              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleLogin('rahaamalhotra@gmail.com', 'Rahaa Malhotra')}
                className="w-full p-2.5 flex items-center justify-between text-left bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 rounded-xl transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-text-primary">Rahaa Malhotra (Employee)</div>
                  <div className="text-[11px] text-text-secondary">rahaamalhotra@gmail.com</div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                  Employee
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-border-custom">
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                Or enter any Google account to sign in / auto-register:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="flex-1 px-3 py-1.5 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
                />
                <button
                  type="button"
                  disabled={googleLoading || !googleCustomEmail.trim()}
                  onClick={() => handleGoogleLogin(googleCustomEmail.trim())}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

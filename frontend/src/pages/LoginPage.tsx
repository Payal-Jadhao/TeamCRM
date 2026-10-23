import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Lock, Mail, ArrowRight, ShieldCheck, Key, X, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Unregistered Google email dialog popup
  const [isUnregisteredPopupOpen, setIsUnregisteredPopupOpen] = useState(false);

  // First-time login password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  // Forgot Password Modal state (Step 1: Enter email, Step 2: Verify OTP, Step 3: Enter new password)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Google OAuth modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Check URL params for OAuth failure redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError === 'unregistered_email' || oauthError === 'access_denied') {
      setIsUnregisteredPopupOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Standard Login Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normEmail = email.trim().toLowerCase();
    const normPass = password.trim();

    try {
      const res = await login(normEmail, normPass);
      if (res.isFirstLogin) {
        setMustChangePassword(true);
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Execute
  const handleGoogleLogin = async (selectedEmail: string, fullName?: string) => {
    setGoogleLoading(true);
    setError('');
    const cleanEmail = selectedEmail.trim().toLowerCase();
    try {
      await loginWithGoogle(cleanEmail, fullName);
      setIsGoogleModalOpen(false);
      window.location.href = '/';
    } catch (err: any) {
      console.warn('Google login failed:', err);
      const errMsg: string = err.response?.data?.message || err.message || '';
      setIsGoogleModalOpen(false);
      if (
        errMsg.toLowerCase().includes('not registered') ||
        errMsg.toLowerCase().includes('contact admin') ||
        err?.response?.status === 401
      ) {
        setIsUnregisteredPopupOpen(true);
      } else {
        setError(errMsg || 'Authentication failed. Please try again.');
      }
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

    const trimmedEmail = forgotEmail.trim().toLowerCase();
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
      setForgotSuccess(res.message || `A 6-digit verification code has been sent to ${trimmedEmail}`);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'This email address does not exist in our system. Please check your registered email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setForgotLoading(true);
    try {
      await authApi.verifyOtp(trimmedEmail, cleanOtp);
      setForgotSuccess('OTP verified successfully! Now set your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || err.message || 'Incorrect or expired OTP verification code. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 3 - Set New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
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

    const trimmedEmail = forgotEmail.trim().toLowerCase();

    setForgotLoading(true);
    try {
      await authApi.verifyAndResetPassword({
        email: trimmedEmail,
        otp: forgotOtp.trim(),
        newPassword: forgotNewPass.trim(),
      });
      setForgotSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setEmail(trimmedEmail);
        setPassword(forgotNewPass.trim());
        setForgotError('');
        setForgotSuccess('');
        setForgotOtp('');
        setForgotNewPass('');
        setForgotConfirmPass('');
      }, 1500);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || err.message || 'Failed to update password. Please try again.');
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
            {/* CRM + Tasks + Server Time Tracking + API Handoff */}
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

            {forgotStep === 1 && (
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
                      placeholder="e.g. payaldjadhao@gmail.com"
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
                    className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'Verifying & Sending OTP...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>A 6-digit verification code has been dispatched to <strong>{forgotEmail}</strong>. Please check your email inbox.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    6-Digit Verification OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2.5 bg-purple-50 text-base font-mono tracking-widest text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none text-center font-bold"
                  />
                  <p className="text-[11px] text-text-secondary mt-1">
                    Enter the 6-digit code received on your email to proceed to password setup.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    ← Back to Email
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.trim().length !== 6}
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'Verifying OTP...' : 'Verify OTP Code'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>OTP verified for <strong>{forgotEmail}</strong>. Please set your new password below.</span>
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
                    onClick={() => {
                      setForgotStep(2);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    ← Back to OTP
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google OAuth Account Chooser Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-[420px] w-full p-7 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {googleLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden">
                <div className="h-full bg-[#1a73e8] animate-pulse w-full"></div>
              </div>
            )}

            {/* Google Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
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
                <span className="text-xs font-medium text-gray-700">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGoogleModalOpen(false);
                  setShowCustomGoogleInput(false);
                }}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Branding */}
            <div className="mt-2 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] flex items-center justify-center text-white shadow-sm mb-4">
                <span className="font-extrabold text-xl tracking-tight">T</span>
              </div>

              <h2 className="text-[22px] font-normal text-[#202124] tracking-tight leading-snug">
                Choose an account
              </h2>
              <p className="text-sm text-[#5f6368] mt-0.5">
                to continue to <span className="text-[#1a73e8] font-medium">TeamCRM</span>
              </p>
            </div>

            {/* Account List or Custom Input */}
            {!showCustomGoogleInput ? (
              <div className="border-t border-gray-200">
                {/* Single Admin Account */}
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => handleGoogleLogin('payaldjadhao@gmail.com', 'Payal Jadhao')}
                  className="w-full text-left flex items-center gap-3.5 py-3.5 px-2 hover:bg-gray-50/80 transition-colors border-b border-gray-200 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-[#8e24aa] text-white flex items-center justify-center font-medium text-sm shrink-0">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202124] truncate">Payal Jadhao (Admin)</p>
                    <p className="text-xs text-[#5f6368] truncate">payaldjadhao@gmail.com</p>
                  </div>
                </button>

                {/* Use Another Account */}
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full text-left flex items-center gap-3.5 py-3.5 px-2 hover:bg-gray-50/80 transition-colors border-b border-gray-200 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202124]">Use another account</p>
                  </div>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleCustomEmail.trim()) {
                    handleGoogleLogin(googleCustomEmail.trim());
                  }
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-[#202124] mb-1.5">
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    placeholder="Enter your Google email"
                    className="w-full px-3.5 py-2.5 text-sm text-[#202124] rounded-lg border border-gray-300 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="text-xs font-medium text-[#1a73e8] hover:underline cursor-pointer"
                  >
                    Back to accounts
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading || !googleCustomEmail.trim()}
                    className="px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-full shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Privacy Policy & Terms */}
            <p className="text-[12px] text-[#5f6368] mt-6 leading-relaxed">
              Before using this app, you can review TeamCRM's{' '}
              <span className="text-[#1a73e8] hover:underline cursor-pointer">Privacy Policy</span>{' '}
              and{' '}
              <span className="text-[#1a73e8] hover:underline cursor-pointer">Terms of Service</span>.
            </p>

            {/* Google Footer */}
            <div className="mt-7 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#5f6368]">
              <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                <span>English (United States)</span>
                <span className="text-[8px]">▼</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hover:text-gray-900 cursor-pointer">Help</span>
                <span className="hover:text-gray-900 cursor-pointer">Privacy</span>
                <span className="hover:text-gray-900 cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unregistered Google Email Dialog Popup */}
      {isUnregisteredPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-[400px] w-full p-6 animate-in zoom-in-95 duration-200 text-center relative">
            <button
              type="button"
              onClick={() => setIsUnregisteredPopupOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">Access Denied</h3>

            <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-6">
              This email is not registered. Contact admin.
            </p>

            <button
              type="button"
              onClick={() => setIsUnregisteredPopupOpen(false)}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Lock, Mail, ArrowRight, ShieldCheck, Key, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

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

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lastAttemptedGoogleEmail, setLastAttemptedGoogleEmail] = useState('');

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

  // Sirf display ke liye email nikalna (security yahan nahi, backend mein hai)
  const getEmailFromJwt = (jwt: string): string => {
    try {
      return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || '';
    } catch {
      return '';
    }
  };

  const handleGoogleSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) {
      setError('Google sign-in failed. Please try again.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    setLastAttemptedGoogleEmail(getEmailFromJwt(cred.credential));

    try {
      await loginWithGoogle(cred.credential);
      window.location.href = '/';
    } catch (err: any) {
      const status = err?.response?.status;
      const msg: string = err.response?.data?.message || err.message || '';
      if (status === 403 && msg.toLowerCase().includes('not registered')) {
        setIsUnregisteredPopupOpen(true); // "Your email is not registered"
      } else {
        setError(msg || 'Authentication failed. Please try again.');
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
      if (res.otp) {
        setForgotOtp(res.otp);
      }
      setForgotStep(2);
    } catch (err: any) {
      const msg: string = err.response?.data?.message || err.message || '';
      if (
        err.response?.status === 404 ||
        msg.toLowerCase().includes('does not exist') ||
        msg.toLowerCase().includes('not registered')
      ) {
        setForgotError('Your email is not registered. Contact admin.');
      } else {
        setForgotError(msg || 'Failed to send verification code. Please try again.');
      }
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
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="outline"
                size="large"
                text="continue_with"
                width="352"
                useOneTap={false}
                auto_select={false}
              />
            </div>
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

            <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-2">
              Your email is not registered. Contact admin.
            </p>

            {lastAttemptedGoogleEmail && (
              <p className="text-xs text-gray-500 font-mono mb-6 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 inline-block max-w-full truncate">
                {lastAttemptedGoogleEmail}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsUnregisteredPopupOpen(false)}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Try another email
              </button>
              <button
                type="button"
                onClick={() => setIsUnregisteredPopupOpen(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

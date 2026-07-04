import React, { useState } from 'react';
import { Mail, ShieldCheck, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Navigation views: 'login' | 'temp_reset' | 'forgot_request' | 'forgot_reset'
  const [view, setView] = useState<'login' | 'temp_reset' | 'forgot_request' | 'forgot_reset'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password reset/OTP flow states
  const [resetUser, setResetUser] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedOtpText, setSimulatedOtpText] = useState('');

  // Helper: Get users list from localStorage
  const getUsersList = () => {
    const defaultUsers = [
      { username: 'admin', email: 'admin@iiser.ac.in', password: 'iiser123', role: 'admin', tempPassword: false },
      { username: 'manager_tst', email: 'tst_manager@iiser.ac.in', password: 'tst123', role: 'manager_project', targetProject: 'tst-lantana', tempPassword: false },
      { username: 'manager_nilgiri', email: 'nilgiri_manager@iiser.ac.in', password: 'nilgiri123', role: 'manager_site', targetProject: 'nilgiri-project', targetSite: 'site_1', tempPassword: false }
    ];
    const stored = localStorage.getItem('userAccounts');
    if (stored) return JSON.parse(stored);
    return defaultUsers;
  };

  // Helper: Save users list to localStorage
  const saveUsersList = (list: any[]) => {
    localStorage.setItem('userAccounts', JSON.stringify(list));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const users = getUsersList();
    const matchedUser = users.find(
      (u: any) => u.username === username.trim() && u.password === password
    );

    if (matchedUser) {
      if (matchedUser.tempPassword) {
        // Force password reset first time
        setResetUser(matchedUser);
        const code = Math.floor(100000 + Math.random() * 900000);
        setSimulatedOtpText(`[SIMULATED EMAIL SYSTEM] To: ${matchedUser.email} - Verification OTP is ${code}`);
        setView('temp_reset');
      } else {
        // Normal sign-in
        localStorage.setItem('currentUser', JSON.stringify(matchedUser));
        onLoginSuccess(matchedUser);
        if (matchedUser.role === 'admin') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/manager';
        }
      }
    } else {
      setError('Invalid username or password. Please verify credentials.');
    }
  };

  // Handler: Change Temporary Password
  const handleTempResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    // Update user in DB
    const users = getUsersList();
    const updated = users.map((u: any) => {
      if (u.username === resetUser.username) {
        return { ...u, password: newPassword, tempPassword: false };
      }
      return u;
    });

    saveUsersList(updated);
    
    // Log the user in
    const loggedUser = updated.find((u: any) => u.username === resetUser.username);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    onLoginSuccess(loggedUser);

    setSuccess('Temporary password changed successfully!');
    if (loggedUser.role === 'admin') {
      window.location.hash = '#/admin';
    } else {
      window.location.hash = '#/manager';
    }
  };

  // Handler: Forgot Password Request (triggers OTP simulation)
  const handleForgotRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getUsersList();
    const matched = users.find(
      (u: any) => u.username === emailInput.trim() || u.email === emailInput.trim()
    );

    if (matched) {
      setResetUser(matched);
      const code = Math.floor(100000 + Math.random() * 900000);
      setSimulatedOtpText(`[SIMULATED EMAIL SYSTEM] To: ${matched.email} - Reset password OTP verification code is ${code}`);
      setView('forgot_reset');
    } else {
      setError('No registered account found with that username or email.');
    }
  };

  // Handler: OTP reset confirmation
  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Update DB
    const users = getUsersList();
    const updated = users.map((u: any) => {
      if (u.username === resetUser.username) {
        return { ...u, password: newPassword, tempPassword: false };
      }
      return u;
    });

    saveUsersList(updated);
    setSuccess('Password reset successfully! Please sign in using your new credentials.');
    setView('login');
    setUsername(resetUser.username);
    setPassword('');
    setResetUser(null);
    setSimulatedOtpText('');
  };

  return (
    <div className="login-page-wrapper">
      {/* Simulated Email / SMS Notification Overlay for testing */}
      {simulatedOtpText && (
        <div className="simulated-otp-alert animate-fade-in">
          <div className="otp-alert-header">
            <Mail size={16} />
            <span>Simulated Outgoing Email Alert (Testing Mode)</span>
          </div>
          <p>{simulatedOtpText}</p>
        </div>
      )}

      <div className="login-card">
        {/* VIEW 1: STANDARD LOGIN */}
        {view === 'login' && (
          <>
            <div className="login-header">
              <img src="/Birdlab_logo.jpeg" alt="Bird Lab Logo" className="login-logo" />
              <h2>observatory sign-in</h2>
              <p>Access administration controls & settings</p>
            </div>

            {error && <div className="login-error-alert"><AlertCircle size={16} /> {error}</div>}
            {success && <div className="login-success-alert">{success}</div>}

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or manager_tst"
                  required
                />
              </div>

              <div className="form-group">
                <div className="label-flex-row">
                  <label htmlFor="password">Password</label>
                  <button 
                    type="button" 
                    className="forgot-link" 
                    onClick={() => { setView('forgot_request'); setError(''); setSuccess(''); }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary login-btn">
                Sign In
              </button>
          </>
        )}

        {/* VIEW 2: FIRST-TIME TEMP PASSWORD RESET */}
        {view === 'temp_reset' && (
          <>
            <div className="login-header">
              <KeyRound size={40} className="icon-header-avatar" />
              <h2>Verify Your Account</h2>
              <p>A temporary demo password was used. Please complete the OTP check to change your password.</p>
            </div>

            {error && <div className="login-error-alert"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleTempResetSubmit} className="login-form">
              <div className="form-group">
                <label>Temporary Verification Code (OTP)</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <div className="form-group">
                <label>Choose New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary login-btn">
                <ShieldCheck size={16} /> Verify & Update Password
              </button>
            </form>
          </>
        )}

        {/* VIEW 3: FORGOT PASSWORD REQUEST EMAIL */}
        {view === 'forgot_request' && (
          <>
            <div className="login-header">
              <Mail size={40} className="icon-header-avatar" />
              <h2>Reset Password</h2>
              <p>Enter your username or email address and we will simulate sending an OTP reset code.</p>
            </div>

            {error && <div className="login-error-alert"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleForgotRequestSubmit} className="login-form">
              <div className="form-group">
                <label>Username or Email Address</label>
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. manager_tst"
                  required
                />
              </div>

              <div className="btn-flex-row">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => { setView('login'); setError(''); }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary flex-2">
                  Request OTP Code
                </button>
              </div>
            </form>
          </>
        )}

        {/* VIEW 4: FORGOT PASSWORD RESET */}
        {view === 'forgot_reset' && (
          <>
            <div className="login-header">
              <KeyRound size={40} className="icon-header-avatar" />
              <h2>Enter Security OTP</h2>
              <p>A verification code was simulated for <strong>{resetUser?.email}</strong>.</p>
            </div>

            {error && <div className="login-error-alert"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleForgotResetSubmit} className="login-form">
              <div className="form-group">
                <label>Simulated Reset Code (OTP)</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <div className="form-group">
                <label>Choose New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="btn-flex-row">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => { setView('forgot_request'); setError(''); setSimulatedOtpText(''); }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="btn btn-primary flex-2">
                  <ShieldCheck size={16} /> Verify & Update Password
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;

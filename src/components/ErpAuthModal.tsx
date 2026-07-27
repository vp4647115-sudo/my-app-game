import React, { useState, useEffect } from 'react';

export interface ErpUserSession {
  studentIdOrEmail: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  department: string;
  argon2idHash: string;
  argon2idParams: {
    memoryKb: number;
    timeCost: number;
    parallelism: number;
    salt: string;
  };
  deviceVerified: boolean;
  isNewDevice: boolean;
  emailOtpVerified: boolean;
  totpVerified: boolean;
  riskScore: number;
  riskFactors: string[];
  loginTimestamp: string;
  sessionId: string;
}

interface ErpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginComplete?: (session: ErpUserSession) => void;
}

// Simulated User DB
const DEMO_ACCOUNTS = [
  {
    idOrEmail: 'STU-2026-8942',
    role: 'student' as const,
    name: 'Alex Thorne',
    department: 'Computer Science & AI',
    pass: 'student123',
    isNewDevice: false,
  },
  {
    idOrEmail: 'teacher.clara@erp.edu',
    role: 'teacher' as const,
    name: 'Prof. Clara Vance',
    department: 'Department of Mathematics',
    pass: 'teacher123',
    isNewDevice: false,
  },
  {
    idOrEmail: 'admin.root@erp.edu',
    role: 'admin' as const,
    name: 'Administrator Vance',
    department: 'ERP Security & Systems',
    pass: 'admin123',
    isNewDevice: true,
  },
];

export const ErpAuthModal: React.FC<ErpAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginComplete,
}) => {
  // Current Auth Flowchart Stage
  // 1: open_erp -> 2: enter_id -> 3: enter_password -> 4: verify_argon2id -> 5: new_device_check -> 6: email_otp -> 7: role_check -> 8: totp_check -> 9: risk_check -> 10: extra_verification -> 11: dashboard
  type AuthStep =
    | 'open_erp'
    | 'enter_id'
    | 'enter_password'
    | 'verify_argon2id'
    | 'new_device_check'
    | 'email_otp'
    | 'role_check'
    | 'totp_check'
    | 'risk_check'
    | 'extra_verification'
    | 'dashboard';

  const [currentStep, setCurrentStep] = useState<AuthStep>('open_erp');

  // Input states
  const [studentId, setStudentId] = useState('STU-2026-8942');
  const [password, setPassword] = useState('student123');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [simulateNewDevice, setSimulateNewDevice] = useState(false);
  const [simulateHighRisk, setSimulateHighRisk] = useState(false);

  // Verification states
  const [argon2Progress, setArgon2Progress] = useState(0);
  const [argon2Hash, setArgon2Hash] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [generatedTotp, setGeneratedTotp] = useState('');
  const [inputTotp, setInputTotp] = useState('');
  const [totpTimer, setTotpTimer] = useState(30);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaNumA, setCaptchaNumA] = useState(7);
  const [captchaNumB, setCaptchaNumB] = useState(5);

  // Status logs
  const [flowHistory, setFlowHistory] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ErpUserSession | null>(null);

  // Sync TOTP timer
  useEffect(() => {
    let interval: any = null;
    if (currentStep === 'totp_check') {
      interval = setInterval(() => {
        setTotpTimer((prev) => {
          if (prev <= 1) {
            // regenerate code
            const newTotp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedTotp(newTotp);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  if (!isOpen) return null;

  const logStep = (msg: string) => {
    setFlowHistory((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  // Quick Preset Selection
  const applyPreset = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setStudentId(account.idOrEmail);
    setPassword(account.pass);
    setSelectedRole(account.role);
    setSimulateNewDevice(account.isNewDevice);
    setErrorMessage(null);
  };

  // Algorithm Execution Handlers

  // 1 -> 2 & 3: Open ERP -> Enter ID & Password
  const handleStartAuth = () => {
    if (!studentId.trim()) {
      setErrorMessage('Please enter a valid Student ID or Email.');
      return;
    }
    setErrorMessage(null);
    logStep(`[Open ERP] Initiated auth for ID: ${studentId}`);

    // Resolve Role
    let role = selectedRole;
    if (studentId.toLowerCase().includes('admin')) role = 'admin';
    else if (studentId.toLowerCase().includes('teacher') || studentId.toLowerCase().includes('tch')) role = 'teacher';
    setSelectedRole(role);

    // Step 4: Verify Password (Argon2id)
    setCurrentStep('verify_argon2id');
    runArgon2idVerification(role);
  };

  // Step 4: Argon2id Cryptographic Verification
  const runArgon2idVerification = (role: 'student' | 'teacher' | 'admin') => {
    setArgon2Progress(0);
    logStep(`[Argon2id] Allocating 64MB memory lanes...`);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setArgon2Progress(p);
      if (p >= 100) {
        clearInterval(interval);
        // Generate cryptographic hash signature
        const salt = Math.random().toString(36).substring(2, 10);
        const derived = `$argon2id$v=19$m=65536,t=3,p=4$${salt}$${btoa(password).substring(0, 16)}`;
        setArgon2Hash(derived);
        logStep(`[Argon2id ✓] Password verified with Argon2id parameters (m=65536, t=3, p=4)`);

        // Proceed to Step 5: New Device Check?
        setTimeout(() => {
          setCurrentStep('new_device_check');
          evaluateDeviceCheck(role);
        }, 600);
      }
    }, 250);
  };

  // Step 5: New Device? Check
  const evaluateDeviceCheck = (role: 'student' | 'teacher' | 'admin') => {
    if (simulateNewDevice) {
      logStep(`[New Device? → YES] Unrecognized device detected. Email OTP required.`);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setCurrentStep('email_otp');
    } else {
      logStep(`[New Device? → NO] Known device fingerprint matched. Continuing.`);
      // Proceed to Step 7: Teacher/Admin Check
      setTimeout(() => {
        evaluateRoleCheck(role);
      }, 500);
    }
  };

  // Step 6: Verify Email OTP
  const handleVerifyEmailOtp = () => {
    if (inputOtp.trim() !== generatedOtp && inputOtp.trim() !== '123456') {
      setErrorMessage(`Invalid Email OTP. (Use ${generatedOtp} or 123456 for testing)`);
      return;
    }
    setErrorMessage(null);
    logStep(`[Email OTP ✓] Email code verified successfully.`);
    // Proceed to Role Check
    evaluateRoleCheck(selectedRole);
  };

  // Step 7: Teacher / Admin? Check
  const evaluateRoleCheck = (role: 'student' | 'teacher' | 'admin') => {
    setCurrentStep('role_check');
    setTimeout(() => {
      if (role === 'teacher' || role === 'admin') {
        logStep(`[Teacher/Admin? → YES] Role '${role}' requires TOTP Authenticator App.`);
        const totp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedTotp(totp);
        setCurrentStep('totp_check');
      } else {
        logStep(`[Teacher/Admin? → NO] Student role detected. Bypassing TOTP.`);
        // Proceed to Step 9: Risk Check
        evaluateRiskCheck();
      }
    }, 600);
  };

  // Step 8: Verify TOTP Authenticator Code
  const handleVerifyTotp = () => {
    if (inputTotp.trim() !== generatedTotp && inputTotp.trim() !== '654321') {
      setErrorMessage(`Invalid Authenticator Code. (Use ${generatedTotp} or 654321)`);
      return;
    }
    setErrorMessage(null);
    logStep(`[Authenticator TOTP ✓] 2FA token verified.`);
    // Proceed to Step 9: Risk Check
    evaluateRiskCheck();
  };

  // Step 9: Risk Check
  const evaluateRiskCheck = () => {
    setCurrentStep('risk_check');
    setTimeout(() => {
      const isHighRisk = simulateHighRisk;
      if (isHighRisk) {
        logStep(`[Risk Check → HIGH RISK] Anomaly score: 78%. Extra Verification required.`);
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 8) + 3;
        setCaptchaNumA(a);
        setCaptchaNumB(b);
        setCaptchaAnswer((a + b).toString());
        setCurrentStep('extra_verification');
      } else {
        logStep(`[Risk Check → LOW RISK] Anomaly score: 12%. Direct login approved.`);
        finalizeLogin();
      }
    }, 700);
  };

  // Step 10: Extra Verification
  const handleVerifyExtra = () => {
    if (userCaptcha.trim() !== captchaAnswer) {
      setErrorMessage(`Incorrect security answer. ${captchaNumA} + ${captchaNumB} = ${captchaAnswer}`);
      return;
    }
    setErrorMessage(null);
    logStep(`[Extra Verification ✓] Security challenge solved.`);
    finalizeLogin();
  };

  // Step 11: Finalize Login -> Dashboard
  const finalizeLogin = () => {
    logStep(`[Login Approved] Generating Argon2id JWT Session & Entering ERP Dashboard...`);
    const session: ErpUserSession = {
      studentIdOrEmail: studentId,
      role: selectedRole,
      name:
        DEMO_ACCOUNTS.find((a) => a.idOrEmail === studentId)?.name ||
        (selectedRole === 'admin'
          ? 'System Administrator'
          : selectedRole === 'teacher'
          ? 'Faculty Professor'
          : 'Scholar Student'),
      department:
        DEMO_ACCOUNTS.find((a) => a.idOrEmail === studentId)?.department || 'Computer Science & AI',
      argon2idHash:
        argon2Hash ||
        `$argon2id$v=19$m=65536,t=3,p=4$${Math.random().toString(36).substring(2, 10)}$${btoa(
          password
        ).substring(0, 16)}`,
      argon2idParams: {
        memoryKb: 65536,
        timeCost: 3,
        parallelism: 4,
        salt: 'a8f19c2e',
      },
      deviceVerified: true,
      isNewDevice: simulateNewDevice,
      emailOtpVerified: simulateNewDevice,
      totpVerified: selectedRole !== 'student',
      riskScore: simulateHighRisk ? 78 : 12,
      riskFactors: simulateHighRisk
        ? ['Unrecognized Geolocation IP', 'Off-Hours Access', 'Argon2id Verification High Velocity']
        : ['Standard Subnet IP', 'Normal Time Window'],
      loginTimestamp: new Date().toISOString(),
      sessionId: 'ERP_SESS_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    };

    setActiveSession(session);
    setCurrentStep('dashboard');

    if (onLoginComplete) {
      onLoginComplete(session);
    }
  };

  const handleResetFlow = () => {
    setCurrentStep('open_erp');
    setFlowHistory([]);
    setErrorMessage(null);
    setActiveSession(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121411]/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-[#D4AF37]/40 shadow-2xl bg-[#181a17] text-[#e3e3de] relative overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#121411]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg md:text-xl font-bold text-[#FAF9F6]">
                  Enterprise ERP Authentication Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#D4AF37] text-[#121411] font-bold">
                  Argon2id + TOTP + Risk AI
                </span>
              </div>
              <p className="text-xs text-[#c4c7c7] font-body">
                Step-by-Step Multi-Factor & Adaptive Auth Flowchart Software Execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#c4c7c7] hover:text-[#FAF9F6] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Visual Flowchart Stepper Tracker */}
        <div className="bg-[#121411] px-4 py-3 border-b border-white/5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max text-[11px] font-mono">
            {[
              { key: 'open_erp', label: '1. Open ERP' },
              { key: 'enter_id', label: '2. ID & Pass' },
              { key: 'verify_argon2id', label: '3. Argon2id Hash' },
              { key: 'new_device_check', label: '4. Device Check' },
              { key: 'email_otp', label: '5. Email OTP' },
              { key: 'role_check', label: '6. Role Check' },
              { key: 'totp_check', label: '7. TOTP App' },
              { key: 'risk_check', label: '8. Risk Engine' },
              { key: 'extra_verification', label: '9. Extra Verify' },
              { key: 'dashboard', label: '10. ERP Dashboard' },
            ].map((st, idx, arr) => {
              const isCurrent = currentStep === st.key;
              const isDone =
                arr.findIndex((x) => x.key === currentStep) > idx || currentStep === 'dashboard';
              return (
                <React.Fragment key={st.key}>
                  <div
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-[#D4AF37] text-[#121411] font-bold shadow-md scale-105'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-[#8f9292]'
                    }`}
                  >
                    {isDone && <span className="material-symbols-outlined text-xs">check</span>}
                    <span>{st.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="text-white/20 text-xs material-symbols-outlined">
                      arrow_forward
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Main Interactive Stage Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STAGE 1: OPEN ERP / ENTER CREDENTIALS */}
            {(currentStep === 'open_erp' || currentStep === 'enter_id' || currentStep === 'enter_password') && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-[#121411]/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">login</span>
                      <span>1. ERP Portal Credentials</span>
                    </span>
                    <span className="text-[10px] text-[#c4c7c7] font-mono">Argon2id Ready</span>
                  </div>

                  {/* Preset Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#8f9292] font-semibold">
                      Select Demo Role Preset:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.idOrEmail}
                          onClick={() => applyPreset(acc)}
                          type="button"
                          className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                            studentId === acc.idOrEmail
                              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FAF9F6] font-bold'
                              : 'bg-white/5 border-white/10 text-[#c4c7c7] hover:bg-white/10'
                          }`}
                        >
                          <div className="capitalize font-bold text-[11px] text-[#D4AF37]">
                            {acc.role}
                          </div>
                          <div className="truncate text-[10px] opacity-80">{acc.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-[#c4c7c7] mb-1">
                        Student ID / Staff Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-[#8f9292]">
                          badge
                        </span>
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="e.g. STU-2026-8942 or teacher@erp.edu"
                          className="w-full pl-9 pr-3 py-2 bg-[#121411] border border-white/15 rounded-xl text-xs text-[#FAF9F6] focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#c4c7c7] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-[#8f9292]">
                          key
                        </span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full pl-9 pr-3 py-2 bg-[#121411] border border-white/15 rounded-xl text-xs text-[#FAF9F6] focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulation Flags Toggles */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[#D4AF37] block">
                      Branch Testing Simulations:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-[#121411] border border-white/10 hover:border-white/20">
                        <input
                          type="checkbox"
                          checked={simulateNewDevice}
                          onChange={(e) => setSimulateNewDevice(e.target.checked)}
                          className="accent-[#D4AF37]"
                        />
                        <span className="text-[11px]">New Device (Email OTP)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-[#121411] border border-white/10 hover:border-white/20">
                        <input
                          type="checkbox"
                          checked={simulateHighRisk}
                          onChange={(e) => setSimulateHighRisk(e.target.checked)}
                          className="accent-[#D4AF37]"
                        />
                        <span className="text-[11px]">High Risk Anomaly</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleStartAuth}
                    type="button"
                    className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Execute Auth Flowchart</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: VERIFY PASSWORD (ARGON2ID) */}
            {currentStep === 'verify_argon2id' && (
              <div className="p-5 rounded-2xl bg-[#121411] border border-[#D4AF37]/50 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-[#D4AF37] animate-spin">
                    memory
                  </span>
                  <div>
                    <h3 className="font-headline text-base font-bold text-[#FAF9F6]">
                      Verifying Password via Argon2id Cryptographic Engine
                    </h3>
                    <p className="text-xs text-[#c4c7c7]">
                      Computing memory-hard password verification algorithm ($m=65536, t=3, p=4$)
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#c4c7c7]">Memory Allocation & Iterations</span>
                    <span className="text-[#D4AF37] font-bold">{argon2Progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#D4AF37] transition-all duration-300"
                      style={{ width: `${argon2Progress}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono space-y-1 text-emerald-400">
                  <div>[+] Argon2id Parameters: memory=64MB, timeCost=3, parallelism=4</div>
                  <div>[+] Password input verified against salted digest</div>
                </div>
              </div>
            )}

            {/* STAGE 6: EMAIL OTP (NEW DEVICE BRANCH) */}
            {currentStep === 'email_otp' && (
              <div className="p-5 rounded-2xl bg-[#121411] border border-amber-500/50 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <span className="material-symbols-outlined text-2xl">devices_off</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-bold text-[#FAF9F6]">
                      New Device Detected → Email OTP
                    </h3>
                    <p className="text-xs text-[#c4c7c7]">
                      A 6-digit verification code was dispatched to email.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
                  <span>Simulated OTP Code:</span>
                  <span className="font-mono font-bold text-base tracking-widest text-[#D4AF37]">
                    {generatedOtp}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-[#c4c7c7]">Enter 6-Digit Email OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full text-center py-3 bg-[#181a17] border border-white/20 rounded-xl font-mono text-lg tracking-[0.3em] text-[#FAF9F6] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleVerifyEmailOtp}
                  type="button"
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Verify Email OTP & Continue
                </button>
              </div>
            )}

            {/* STAGE 8: TOTP AUTHENTICATOR APP (TEACHER/ADMIN BRANCH) */}
            {currentStep === 'totp_check' && (
              <div className="p-5 rounded-2xl bg-[#121411] border border-purple-500/50 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-bold text-[#FAF9F6]">
                      Teacher/Admin MFA → Authenticator App (TOTP)
                    </h3>
                    <p className="text-xs text-[#c4c7c7]">
                      Role requires 2FA Authenticator token.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#8f9292]">Simulated Authenticator Token:</div>
                    <div className="font-mono font-bold text-lg tracking-widest text-[#D4AF37]">
                      {generatedTotp}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-purple-300">
                    <div>Expires in:</div>
                    <div className="font-bold text-base">{totpTimer}s</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-[#c4c7c7]">Enter 6-Digit TOTP Token</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={inputTotp}
                    onChange={(e) => setInputTotp(e.target.value)}
                    placeholder="e.g. 654321"
                    className="w-full text-center py-3 bg-[#181a17] border border-white/20 rounded-xl font-mono text-lg tracking-[0.3em] text-[#FAF9F6] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleVerifyTotp}
                  type="button"
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Verify Authenticator TOTP
                </button>
              </div>
            )}

            {/* STAGE 10: EXTRA VERIFICATION (HIGH RISK BRANCH) */}
            {currentStep === 'extra_verification' && (
              <div className="p-5 rounded-2xl bg-[#121411] border border-red-500/50 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                    <span className="material-symbols-outlined text-2xl">security_update_warning</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-bold text-[#FAF9F6]">
                      High Risk Detected → Extra Verification
                    </h3>
                    <p className="text-xs text-[#c4c7c7]">
                      Adaptive Risk Engine flagged login (Score: 78%). Answer challenge question.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-2 text-xs">
                  <div className="font-bold text-red-300">Security Math Challenge:</div>
                  <div className="text-sm font-mono text-[#FAF9F6]">
                    What is <span className="text-[#D4AF37] font-bold">{captchaNumA} + {captchaNumB}</span>?
                  </div>
                </div>

                <input
                  type="text"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  placeholder="Enter answer"
                  className="w-full py-2.5 px-3 bg-[#181a17] border border-white/20 rounded-xl text-xs text-[#FAF9F6] focus:border-[#D4AF37] focus:outline-none"
                />

                <button
                  onClick={handleVerifyExtra}
                  type="button"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Complete Extra Verification
                </button>
              </div>
            )}

            {/* STAGE 11: ERP DASHBOARD */}
            {currentStep === 'dashboard' && activeSession && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#121411] to-[#181a17] border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-lg">
                        {activeSession.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">
                            {activeSession.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-[#121411]">
                            {activeSession.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#c4c7c7]">{activeSession.department}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SESSION ACTIVE
                    </span>
                  </div>

                  {/* Argon2id Cryptographic Proof Card */}
                  <div className="p-3.5 rounded-xl bg-[#121411] border border-white/10 text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between text-[#D4AF37] font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                        Argon2id Key Verification Badge
                      </span>
                      <span>Verified</span>
                    </div>
                    <div className="text-[10px] text-[#c4c7c7] truncate">
                      Hash: {activeSession.argon2idHash}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-[#8f9292] pt-1 border-t border-white/5">
                      <div>m: {activeSession.argon2idParams.memoryKb} KB</div>
                      <div>t: {activeSession.argon2idParams.timeCost} iterations</div>
                      <div>p: {activeSession.argon2idParams.parallelism} lanes</div>
                    </div>
                  </div>

                  {/* Portal Quick Metrics */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-[#8f9292] uppercase">Attendance</div>
                      <div className="text-base font-bold text-[#FAF9F6] font-headline">96.4%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-[#8f9292] uppercase">Courses Enrolled</div>
                      <div className="text-base font-bold text-[#D4AF37] font-headline">6 Active</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[10px] text-[#8f9292] uppercase">Security Score</div>
                      <div className="text-base font-bold text-emerald-400 font-headline">
                        {100 - activeSession.riskScore}%
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleResetFlow}
                    type="button"
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-[#FAF9F6] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span>Re-Run Auth Algorithm Flowchart</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Flowchart Terminal & Real-Time Audit Log Right Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Algorithm Flowchart Tree Diagram */}
            <div className="p-4 rounded-2xl bg-[#121411] border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">account_tree</span>
                <span>Auth Algorithm Flowchart</span>
              </span>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] leading-relaxed text-[#c4c7c7] space-y-1">
                <div className="text-[#FAF9F6]">Open ERP</div>
                <div className="text-[#8f9292] pl-2">↓ Enter Student ID / Email</div>
                <div className="text-[#8f9292] pl-2">↓ Enter Password</div>
                <div className="text-amber-400 pl-2">↓ Verify Password (Argon2id)</div>
                <div className="text-[#8f9292] pl-4">↓ New Device?</div>
                <div className="text-amber-300 pl-6">├── Yes → Email OTP</div>
                <div className="text-emerald-400 pl-6">└── No → Continue</div>
                <div className="text-[#8f9292] pl-4">↓ Teacher/Admin?</div>
                <div className="text-purple-300 pl-6">├── Yes → Authenticator App (TOTP)</div>
                <div className="text-emerald-400 pl-6">└── No → Continue</div>
                <div className="text-[#8f9292] pl-4">↓ Risk Check</div>
                <div className="text-red-400 pl-6">├── High Risk → Extra Verification</div>
                <div className="text-emerald-400 pl-6">└── Low Risk → Login</div>
                <div className="text-emerald-400 font-bold pl-2">↓ Dashboard</div>
              </div>
            </div>

            {/* Execution Audit Log */}
            <div className="p-4 rounded-2xl bg-[#121411] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#FAF9F6]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]">terminal</span>
                  Execution Audit Log
                </span>
                <span className="text-[10px] text-[#8f9292] font-mono">
                  {flowHistory.length} events
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/80 border border-white/5 font-mono text-[10px] text-emerald-400 max-h-48 overflow-y-auto space-y-1">
                {flowHistory.length === 0 ? (
                  <div className="text-[#8f9292] italic">Waiting to start auth execution...</div>
                ) : (
                  flowHistory.map((log, idx) => <div key={idx}>{log}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react'
import { api } from '../api/client'
import { Card, Button, Input, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Bell, Shield, Save, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  // Profile
  const [name, setName]         = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg]       = useState<string | null>(null)
  const [profileErr, setProfileErr]       = useState<string | null>(null)

  // Password
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd]   = useState(false)
  const [pwdMsg, setPwdMsg]         = useState<string | null>(null)
  const [pwdErr, setPwdErr]         = useState<string | null>(null)

  // Notification preferences (UI only)
  const [notifTask, setNotifTask]     = useState(true)
  const [notifMeeting, setNotifMeeting] = useState(true)
  const [notifRisk, setNotifRisk]     = useState(true)

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg(null)
    setProfileErr(null)
    try {
      await api.patch('/api/auth/profile', { name })
      setProfileMsg('Profile updated successfully!')
      setTimeout(() => setProfileMsg(null), 3000)
    } catch (e: any) {
      setProfileErr(e?.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    setPwdMsg(null)
    setPwdErr(null)
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdErr('All fields required.'); return }
    if (newPwd.length < 6) { setPwdErr('New password must be at least 6 characters.'); return }
    if (newPwd !== confirmPwd) { setPwdErr('Passwords do not match.'); return }
    setSavingPwd(true)
    try {
      await api.patch('/api/auth/profile', { current_password: currentPwd, new_password: newPwd })
      setPwdMsg('Password changed successfully!')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setTimeout(() => setPwdMsg(null), 3000)
    } catch (e: any) {
      setPwdErr(e?.response?.data?.detail || 'Failed to change password.')
    } finally {
      setSavingPwd(false)
    }
  }

  const roleBadge: Record<string, string> = {
    admin:       'bg-rose-100 text-rose-700',
    faculty:     'bg-amber-100 text-amber-700',
    team_leader: 'bg-indigo-100 text-indigo-700',
    student:     'bg-emerald-100 text-emerald-700',
  }
  const roleLabel: Record<string, string> = {
    admin: 'Administrator', faculty: 'Faculty Guide', team_leader: 'Team Leader', student: 'Student',
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-10 h-5.5 rounded-full relative transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}
      style={{ height: '22px' }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`}
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  )

  return (
    <div className="p-6 max-w-2xl space-y-5">
      {/* Profile section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-5">
          <User size={17} className="text-indigo-600" /> Profile Settings
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg">{user?.name}</div>
            <div className="text-sm text-slate-400">{user?.email}</div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${roleBadge[user?.role || 'student']}`}>
              {roleLabel[user?.role || 'student']}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email (cannot be changed)"
            defaultValue={user?.email}
            disabled
            className="bg-slate-50 text-slate-400"
          />
          <Input
            label="Role (set at signup)"
            defaultValue={roleLabel[user?.role || 'student']}
            disabled
            className="bg-slate-50 text-slate-400"
          />
          {profileMsg && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 size={14} /> {profileMsg}
            </div>
          )}
          {profileErr && <p className="text-sm text-rose-500">{profileErr}</p>}
          <Button onClick={saveProfile} loading={savingProfile}>
            <Save size={14} /> Save Profile
          </Button>
        </div>
      </Card>

      {/* Password section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-5">
          <Lock size={17} className="text-indigo-600" /> Change Password
        </div>
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Min. 6 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Repeat new password"
          />
          {pwdMsg && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 size={14} /> {pwdMsg}
            </div>
          )}
          {pwdErr && <p className="text-sm text-rose-500">{pwdErr}</p>}
          <Button onClick={savePassword} loading={savingPwd}>
            <Lock size={14} /> Change Password
          </Button>
        </div>
      </Card>

      {/* Notification preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-5">
          <Bell size={17} className="text-indigo-600" /> Notification Preferences
        </div>
        <div className="space-y-4">
          {[
            { label: 'Task assignments & updates', desc: 'Get notified when tasks are assigned or updated', state: notifTask, set: () => setNotifTask((v) => !v) },
            { label: 'Meeting reminders', desc: 'Receive reminders before scheduled meetings', state: notifMeeting, set: () => setNotifMeeting((v) => !v) },
            { label: 'AI risk alerts', desc: 'Get AI-powered risk predictions for your project', state: notifRisk, set: () => setNotifRisk((v) => !v) },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-semibold text-slate-700">{n.label}</div>
                <div className="text-xs text-slate-400">{n.desc}</div>
              </div>
              <Toggle checked={n.state} onChange={n.set} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Email notifications require email configuration in backend/.env (SendGrid / SES)
        </p>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-rose-200">
        <div className="flex items-center gap-2 font-semibold text-rose-600 mb-3">
          <Shield size={17} /> Account
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Your account role is locked to <strong>{roleLabel[user?.role || 'student']}</strong>. Contact an admin to change it.
        </p>
      </Card>
    </div>
  )
}

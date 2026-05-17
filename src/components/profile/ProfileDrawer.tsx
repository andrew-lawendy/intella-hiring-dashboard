import { useState, useEffect, useMemo } from 'react'
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  LogOutIcon,
  CameraIcon,
  MailIcon,
  LockIcon,
  XIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpsertProfile } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function getInitials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?'
}

interface ProfileDrawerProps {
  open: boolean
  onClose: () => void
}

export function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: profile } = useProfile(user?.id)
  const { mutateAsync: upsert, isPending: saving } = useUpsertProfile()

  const [draft, setDraft] = useState({ first_name: '', last_name: '', title: '', avatar_url: '' })
  const [confirmSignout, setConfirmSignout] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open && profile) {
      setDraft({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        title: profile.title ?? '',
        avatar_url: profile.avatar_url ?? '',
      })
    }
  }, [open, profile])

  const dirty = useMemo(() => {
    if (!profile) return draft.first_name !== '' || draft.last_name !== '' || draft.title !== ''
    return (
      draft.first_name !== (profile.first_name ?? '') ||
      draft.last_name !== (profile.last_name ?? '') ||
      draft.title !== (profile.title ?? '') ||
      draft.avatar_url !== (profile.avatar_url ?? '')
    )
  }, [draft, profile])

  const avatarInitials = getInitials(draft.first_name, draft.last_name)

  function update(patch: Partial<typeof draft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function handleClose() {
    setConfirmSignout(false)
    onClose()
  }

  async function handleSave() {
    if (!user?.id) return
    await upsert({
      id: user.id,
      first_name: draft.first_name.trim() || null,
      last_name: draft.last_name.trim() || null,
      title: draft.title.trim() || null,
      avatar_url: draft.avatar_url.trim() || null,
      theme,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => update({ avatar_url: String(reader.result) })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Profile settings
              </h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Manage how you appear and how the app feels.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Avatar block */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[16px] font-semibold overflow-hidden">
                {draft.avatar_url ? (
                  <img src={draft.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                aria-label="Change profile photo"
              >
                <CameraIcon className="size-2.5 text-muted-foreground" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground">
                {draft.first_name || draft.last_name
                  ? `${draft.first_name} ${draft.last_name}`.trim()
                  : 'Your name'}
              </p>
              <p className="text-[12px] text-muted-foreground">{draft.title || '—'}</p>
              <div className="flex gap-3 mt-1.5">
                <label
                  htmlFor="avatar-upload-2"
                  className="text-[12px] text-primary cursor-pointer hover:underline"
                >
                  {draft.avatar_url ? 'Change photo' : 'Upload photo'}
                  <input
                    id="avatar-upload-2"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="sr-only"
                  />
                </label>
                {draft.avatar_url && (
                  <button
                    type="button"
                    onClick={() => update({ avatar_url: '' })}
                    className="text-[12px] text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Identity */}
          <Section title="Identity">
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="First name" htmlFor="first-name">
                <Input
                  id="first-name"
                  value={draft.first_name}
                  onChange={(e) => update({ first_name: e.target.value })}
                  autoComplete="given-name"
                />
              </FieldWrapper>
              <FieldWrapper label="Last name" htmlFor="last-name">
                <Input
                  id="last-name"
                  value={draft.last_name}
                  onChange={(e) => update({ last_name: e.target.value })}
                  autoComplete="family-name"
                />
              </FieldWrapper>
            </div>
            <FieldWrapper
              label="Job title"
              htmlFor="job-title"
              hint="Shown on candidate notes and decisions"
            >
              <Input
                id="job-title"
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                autoComplete="organization-title"
                placeholder="e.g. Head of Talent"
              />
            </FieldWrapper>
          </Section>

          {/* Account (read-only) */}
          <Section title="Account" note="Managed by Intella">
            <FieldWrapper label="Email">
              <div className="flex items-center justify-between h-9 px-3 rounded-md border border-input bg-muted/40 text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <MailIcon className="size-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{user?.email}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 flex-shrink-0 ml-2">
                  <LockIcon className="size-3" aria-hidden="true" /> Read-only
                </span>
              </div>
            </FieldWrapper>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <FieldWrapper label="Theme" hint="'System' follows your OS setting.">
              <div
                className="flex rounded-lg border border-input bg-muted p-0.5 gap-0.5"
                role="radiogroup"
                aria-label="Theme"
              >
                {[
                  { value: 'light' as const, label: 'Light', Icon: SunIcon },
                  { value: 'dark' as const, label: 'Dark', Icon: MoonIcon },
                  { value: 'system' as const, label: 'System', Icon: MonitorIcon },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={theme === value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer',
                      theme === value
                        ? 'bg-background text-foreground shadow-xs border border-border'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </FieldWrapper>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmSignout(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOutIcon className="size-3.5" />
            Sign out
          </Button>
          <div className="flex items-center gap-2.5">
            {saved && (
              <span className="text-[12.5px] text-[var(--green)] font-medium">Saved ✓</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Sign out confirmation */}
      {confirmSignout && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40"
          onClick={() => setConfirmSignout(false)}
        >
          <div
            className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-[340px] mx-4"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="signout-title"
          >
            <h3 id="signout-title" className="text-[15px] font-semibold text-foreground mb-2">
              Sign out of Intella?
            </h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              You'll need a new sign-in link sent to your email to get back in.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmSignout(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={signOut}>
                <LogOutIcon className="size-3.5" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
        {note && <p className="text-[11px] text-muted-foreground/60">{note}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function FieldWrapper({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-[13px]">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

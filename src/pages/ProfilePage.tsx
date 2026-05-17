import { useState, useEffect, useMemo } from 'react'
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  LogOutIcon,
  CameraIcon,
  MailIcon,
  LockIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpsertProfile } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function resolveScoreSlot(email: string | undefined): 'peter' | 'ossama' {
  return email?.startsWith('peter') ? 'peter' : 'ossama'
}

function initials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?'
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: profile, isLoading } = useProfile(user?.id)
  const { mutateAsync: upsert, isPending: saving } = useUpsertProfile()

  const scorerSlot = resolveScoreSlot(user?.email)
  const scorerLabel = scorerSlot === 'peter' ? 'Scorer A · Peter' : 'Scorer B · Ossama'

  const [draft, setDraft] = useState({ first_name: '', last_name: '', title: '', avatar_url: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setDraft({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        title: profile.title ?? '',
        avatar_url: profile.avatar_url ?? '',
      })
    }
  }, [profile])

  const dirty = useMemo(() => {
    if (!profile) return draft.first_name !== '' || draft.last_name !== '' || draft.title !== ''
    return (
      draft.first_name !== (profile.first_name ?? '') ||
      draft.last_name !== (profile.last_name ?? '') ||
      draft.title !== (profile.title ?? '') ||
      draft.avatar_url !== (profile.avatar_url ?? '')
    )
  }, [draft, profile])

  const avatarInitials = initials(draft.first_name, draft.last_name)

  function update(patch: Partial<typeof draft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    if (!user?.id) return
    await upsert({
      id: user.id,
      first_name: draft.first_name.trim() || null,
      last_name: draft.last_name.trim() || null,
      title: draft.title.trim() || null,
      avatar_url: draft.avatar_url.trim() || null,
      scorer_slot: scorerSlot,
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

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg mb-4" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground mb-1">
          Profile settings
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Manage how you appear and how the app feels.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-4 rounded-lg border border-border bg-muted/30">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[18px] font-semibold overflow-hidden">
            {draft.avatar_url ? (
              <img src={draft.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              avatarInitials
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
            aria-label="Change profile photo"
          >
            <CameraIcon className="size-3 text-muted-foreground" />
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
          <p className="text-[12px] text-muted-foreground mt-0.5">{draft.title || '—'}</p>
          <div className="flex gap-3 mt-2">
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
        <div className="grid grid-cols-2 gap-4">
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
            <span className="flex items-center gap-2 text-muted-foreground">
              <MailIcon className="size-3.5" aria-hidden="true" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <LockIcon className="size-3" aria-hidden="true" />
              Read-only
            </span>
          </div>
        </FieldWrapper>
        <FieldWrapper
          label="Scorer slot"
          hint="Determines which scoring column your reviews land in."
        >
          <div className="flex items-center justify-between h-9 px-3 rounded-md border border-input bg-muted/40 text-[13px]">
            <span className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                aria-hidden="true"
              />
              <span className="text-foreground font-medium">{scorerLabel}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <LockIcon className="size-3" aria-hidden="true" />
              Read-only
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

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOutIcon className="size-3.5" />
          Sign out
        </Button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-[12.5px] text-[var(--green)] font-medium">Saved ✓</span>}
          <Button onClick={handleSave} disabled={!dirty || saving} loading={saving} size="sm">
            Save changes
          </Button>
        </div>
      </div>
    </div>
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
        {note && <p className="text-[11px] text-muted-foreground/60">{note}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
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

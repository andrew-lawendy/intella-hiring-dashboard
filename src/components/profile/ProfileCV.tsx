import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileCVProps {
  candidateId: string
  photoUrl: string | null
  onPhotoSave: (url: string | null) => void
}

export function ProfileCV({ candidateId, photoUrl, onPhotoSave }: ProfileCVProps) {
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [loadingCv, setLoadingCv] = useState(false)
  const [photoInput, setPhotoInput] = useState(photoUrl ?? '')
  const [photoSaved, setPhotoSaved] = useState(false)

  const openCV = async () => {
    setLoadingCv(true)
    const { data } = await supabase.storage
      .from('candidate-cvs')
      .createSignedUrl(`${candidateId}.pdf`, 3600)
    setLoadingCv(false)
    if (data?.signedUrl) {
      setCvUrl(data.signedUrl)
      window.open(data.signedUrl, '_blank')
    }
  }

  const savePhoto = () => {
    onPhotoSave(photoInput.trim() || null)
    setPhotoSaved(true)
    setTimeout(() => setPhotoSaved(false), 2000)
  }

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">CV</p>
        <button
          onClick={openCV}
          disabled={loadingCv}
          className="px-4 py-2 bg-surface border border-border rounded-[var(--radius-xs)] text-xs font-medium text-text cursor-pointer hover:bg-text hover:text-bg hover:border-text transition-all disabled:opacity-50"
        >
          {loadingCv ? 'Loading...' : 'Open CV (PDF)'}
        </button>
        {cvUrl && (
          <p className="text-[11px] text-text3 mt-2">
            CV opened in new tab. Link expires in 1 hour.
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
          Photo URL
        </p>
        <input
          value={photoInput}
          onChange={(e) => setPhotoInput(e.target.value)}
          placeholder="https://..."
          className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text text-xs font-sans outline-none focus:border-text"
        />
        <button
          onClick={savePhoto}
          className="mt-2 px-3 py-1.5 bg-text text-bg rounded-[var(--radius-xs)] text-[11px] font-medium cursor-pointer hover:opacity-85 border-none"
        >
          Save Photo
        </button>
        {photoSaved && (
          <span className="ml-2 text-[10.5px] text-[var(--green)] font-medium">Saved</span>
        )}
      </div>
    </div>
  )
}

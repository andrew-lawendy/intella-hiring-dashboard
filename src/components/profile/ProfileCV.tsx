import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
        <Button variant="outline" size="sm" onClick={openCV} disabled={loadingCv}>
          {loadingCv ? 'Loading...' : 'Open CV (PDF)'}
        </Button>
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
        <Input
          value={photoInput}
          onChange={(e) => setPhotoInput(e.target.value)}
          placeholder="https://..."
          className="text-xs"
        />
        <Button size="sm" onClick={savePhoto} className="mt-2">
          Save Photo
        </Button>
        {photoSaved && (
          <span className="ml-2 text-[10.5px] text-[var(--green)] font-medium">Saved</span>
        )}
      </div>
    </div>
  )
}

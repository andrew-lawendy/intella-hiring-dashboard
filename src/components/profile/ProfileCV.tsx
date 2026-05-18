import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface ProfileCVProps {
  candidateId: string
}

export function ProfileCV({ candidateId }: ProfileCVProps) {
  const [loadingDownload, setLoadingDownload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openCV = async () => {
    setLoadingDownload(true)
    const { data } = await supabase.storage
      .from('candidate-cvs')
      .createSignedUrl(`${candidateId}.pdf`, 3600)
    setLoadingDownload(false)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    const { error } = await supabase.storage
      .from('candidate-cvs')
      .upload(`${candidateId}.pdf`, file, { upsert: true, contentType: 'application/pdf' })

    setUploading(false)
    if (error) {
      setUploadError(error.message)
    } else {
      setUploadedAt(new Date())
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
          Download
        </p>
        <Button variant="outline" size="sm" onClick={openCV} disabled={loadingDownload}>
          {loadingDownload ? 'Loading...' : 'Open CV (PDF)'}
        </Button>
        <p className="text-[11px] text-text3 mt-2">Opens in a new tab. Link expires in 1 hour.</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
          Upload / Replace
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Choose PDF'}
        </Button>
        {uploadedAt && (
          <p className="text-[11px] text-[var(--green)] mt-2">
            Uploaded at {uploadedAt.toLocaleTimeString()}
          </p>
        )}
        {uploadError && <p className="text-[11px] text-[var(--red)] mt-2">{uploadError}</p>}
      </div>
    </div>
  )
}

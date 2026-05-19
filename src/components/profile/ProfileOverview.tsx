// src/components/profile/ProfileOverview.tsx
import type { Database } from '@/lib/database.types'
import { ProfileLogistics } from './ProfileLogistics'
import { ProfileSnapshotSection } from './ProfileSnapshotSection'
import { ProfileBackgroundSection } from './ProfileBackgroundSection'

type Candidate = Database['public']['Tables']['candidates']['Row']
type Profile = Database['public']['Tables']['candidate_profiles']['Row']
type Analysis = Database['public']['Tables']['candidate_analysis']['Row']

interface ProfileOverviewProps {
  candidate: Candidate
  profile: Profile
  analysis: Analysis | null
}

export function ProfileOverview({ candidate, profile, analysis }: ProfileOverviewProps) {
  return (
    <div>
      <ProfileLogistics candidate={candidate} />
      <div className="px-6">
        <ProfileSnapshotSection profile={profile} />
        <ProfileBackgroundSection analysis={analysis} candidateId={candidate.id} />
      </div>
    </div>
  )
}

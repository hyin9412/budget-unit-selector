import emptyIllustration from '../../插画.svg'

interface TransferEmptyStateProps {
  message: string
}

export default function TransferEmptyState({ message }: TransferEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <img src={emptyIllustration} alt="" aria-hidden="true" className="h-20 w-20" />
      <p className="text-[13px] leading-[22px] text-[#737a87]">{message}</p>
    </div>
  )
}

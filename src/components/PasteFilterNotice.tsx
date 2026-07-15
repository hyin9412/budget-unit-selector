import warningIcon from '../../icon-hover.svg'

interface PasteFilterNoticeProps {
  invalidCount?: number
  message?: string
}

export default function PasteFilterNotice({ invalidCount = 0, message }: PasteFilterNoticeProps) {
  if (!message && invalidCount <= 0) {
    return null
  }

  const content = message ?? `粘贴内容中有${invalidCount}个无效值，已自动过滤`

  return (
    <div className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <img src={warningIcon} alt="" aria-hidden="true" className="h-3 w-3 shrink-0" />
      <p className="shrink-0 whitespace-nowrap text-[13px] leading-[20px] text-[#bd7e00]">{content}</p>
    </div>
  )
}

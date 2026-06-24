import warningIcon from '../../icon-hover.svg'

interface PasteFilterNoticeProps {
  invalidCount: number
}

export default function PasteFilterNotice({ invalidCount }: PasteFilterNoticeProps) {
  if (invalidCount <= 0) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-1">
      <img src={warningIcon} alt="" aria-hidden="true" className="h-3 w-3 shrink-0" />
      <p className="text-[13px] leading-[22px] text-[#bd7e00]">粘贴内容中有{invalidCount}个无效值，已自动过滤</p>
    </div>
  )
}

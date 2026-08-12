/**
 * Truepost "TP" logo — uses the PNG asset from /public/truepost-logo.png.
 * Sized by className so the nav, sign-in card and footer can share it.
 */
export default function Logo({ className = 'size-9' }) {
  return (
    <img
      src="/truepost-logo.png"
      alt="Truepost"
      className={className}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  )
}

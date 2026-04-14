export default function LoadingSpinner({ size = 24, center = false }) {
  const spinner = (
    <div
      className="spinner"
      style={{ width: size, height: size }}
    />
  )
  if (center) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        {spinner}
      </div>
    )
  }
  return spinner
}

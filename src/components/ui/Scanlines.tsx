interface ScanlinesProps {
  opacity?: number
}

export function Scanlines({ opacity = 1 }: ScanlinesProps) {
  return (
    <div
      className="scanlines"
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}

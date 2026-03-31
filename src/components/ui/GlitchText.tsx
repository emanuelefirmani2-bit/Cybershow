import { HTMLAttributes } from 'react'

interface GlitchTextProps extends HTMLAttributes<HTMLSpanElement> {
  text: string
  active?: boolean
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div'
}

export function GlitchText({
  text,
  active = false,
  tag: Tag = 'span',
  className = '',
  ...props
}: GlitchTextProps) {
  return (
    <Tag
      data-text={text}
      className={[
        active ? 'glitch-text' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {text}
    </Tag>
  )
}

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', className = '', type = 'button', children, ...props }, ref) {
  return <button {...props} ref={ref} type={type} className={`button button-${variant} ${className}`.trim()}>{children}</button>
})

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  danger?: boolean
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ danger = false, className = '', type = 'button', children, ...props }, ref) {
  return <button {...props} ref={ref} type={type} className={`icon-button ${danger ? 'danger' : ''} ${className}`.trim()}>{children}</button>
})

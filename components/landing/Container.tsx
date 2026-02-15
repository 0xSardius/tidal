interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`w-full max-w-6xl mx-auto px-6 ${className}`}>
      {children}
    </div>
  )
}

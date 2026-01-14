import { useEffect, useState, useRef, useCallback, type FC, type HTMLAttributes } from 'react'
import { useNavigation } from 'react-router'
import './ProgressIndicator.css'

type Props = HTMLAttributes<HTMLDivElement>

const ProgressIndicator: FC<Props> = (props) => {
  const { className = '', ...rest } = props
  const { state } = useNavigation()

  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const completeAnimation = useCallback(() => {
    setProgress(100)
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
      setProgress(0)
    }, 200)
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (state === 'loading') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true)
      setProgress(70)
    } else if (isAnimating) {
      completeAnimation()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [state, isAnimating, completeAnimation])

  return (
    <div {...rest} className={`progress-container ${className}`}>
      <div
        className="progress-bar"
        style={{
          width: `${progress}%`,
          transition: isAnimating
            ? progress === 100
              ? 'width 200ms ease-in-out'
              : 'width 2s ease-in-out .5s'
            : 'none'
        }}
      />
    </div>
  )
}

export default ProgressIndicator

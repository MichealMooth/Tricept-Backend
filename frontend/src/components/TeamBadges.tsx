/**
 * TeamBadges Component
 *
 * Displays team tags for an employee with overflow handling.
 * Shows first 2 teams as badges, with "+N" tooltip for additional teams.
 * Non-clickable, informational only.
 *
 * Task Group 4.2
 */

import { useState, useRef, useEffect } from 'react'

export interface TeamBadge {
  id: string
  name: string
}

export interface TeamBadgesProps {
  teams: TeamBadge[]
  maxVisible?: number
}

export function TeamBadges(props: TeamBadgesProps) {
  const { teams, maxVisible = 2 } = props
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false)
      }
    }

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTooltip])

  if (!teams || teams.length === 0) {
    return <span className="text-gray-400">-</span>
  }

  const visibleTeams = teams.slice(0, maxVisible)
  const hiddenTeams = teams.slice(maxVisible)
  const hasOverflow = hiddenTeams.length > 0

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleTeams.map((team) => (
        <span
          key={team.id}
          className="inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
        >
          {team.name}
        </span>
      ))}
      {hasOverflow && (
        <span className="relative" ref={triggerRef}>
          <span
            className="inline-flex cursor-default items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            role="tooltip"
            aria-label={`${hiddenTeams.length} weitere Teams: ${hiddenTeams.map((t) => t.name).join(', ')}`}
          >
            +{hiddenTeams.length}
          </span>
          {showTooltip && (
            <div
              ref={tooltipRef}
              className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
              style={{ minWidth: '120px' }}
            >
              <div className="mb-1 font-medium">Weitere Teams:</div>
              <ul className="space-y-0.5">
                {hiddenTeams.map((team) => (
                  <li key={team.id}>{team.name}</li>
                ))}
              </ul>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </span>
      )}
    </div>
  )
}

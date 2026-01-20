/**
 * Team Section Wrapper Component
 *
 * Wrapper component for displaying TEAM-scoped data in sections.
 * Each team's data is displayed under a header with the team name.
 *
 * Task Group 6.5: Create TeamSectionWrapper
 */

import { ReactNode } from 'react';

interface TeamSection {
  teamGroupId: string;
  teamName: string;
  children: ReactNode;
}

interface TeamSectionWrapperProps {
  /** Array of team sections to display */
  sections: TeamSection[];

  /** Optional title above all sections */
  title?: string;

  /** Optional className for the container */
  className?: string;
}

/**
 * Renders content organized by team sections.
 * Useful for displaying TEAM-scoped data where users belong to multiple teams.
 */
export function TeamSectionWrapper({
  sections,
  title,
  className = '',
}: TeamSectionWrapperProps) {
  if (sections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Keine Daten verfuegbar
      </div>
    );
  }

  // Sort sections alphabetically by team name
  const sortedSections = [...sections].sort((a, b) =>
    a.teamName.localeCompare(b.teamName)
  );

  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
      )}

      <div className="space-y-6">
        {sortedSections.map((section) => (
          <div
            key={section.teamGroupId}
            className="border rounded-lg overflow-hidden"
          >
            {/* Team Header */}
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-800">
                {section.teamName}
              </h3>
            </div>

            {/* Team Content */}
            <div className="p-4">{section.children}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Single team section component for use outside the wrapper.
 */
export function TeamSection({
  teamName,
  children,
}: {
  teamName: string;
  children: ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-medium text-gray-800">{teamName}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

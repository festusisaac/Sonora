import React from 'react';
import { ScreenReaderAnnouncement, ScreenReaderAnnouncementProps } from './ScreenReaderAnnouncement';

export type AccessibilityAnnouncementProps = ScreenReaderAnnouncementProps;

export const AccessibilityAnnouncement: React.FC<AccessibilityAnnouncementProps> = (props) => {
  return <ScreenReaderAnnouncement {...props} />;
};

import { describe, it, expect } from 'vitest';
import { getTimelineStage } from './UserDashboard';

describe('UserDashboard Utilities', () => {
  describe('getTimelineStage', () => {
    it('should map Ignition-related stages correctly', () => {
      expect(getTimelineStage('Ignition')).toBe('Ignition');
      expect(getTimelineStage('discovery')).toBe('Ignition');
      expect(getTimelineStage('Dive-In')).toBe('Ignition');
    });

    it('should map Branding-related stages correctly', () => {
      expect(getTimelineStage('Branding')).toBe('Branding');
      expect(getTimelineStage('design')).toBe('Branding');
      expect(getTimelineStage('map')).toBe('Branding');
    });

    it('should map Outreach-related stages correctly', () => {
      expect(getTimelineStage('Outreach')).toBe('Outreach');
      expect(getTimelineStage('deployment')).toBe('Outreach');
      expect(getTimelineStage('match')).toBe('Outreach');
    });

    it('should return the original string if no mapping exists', () => {
      expect(getTimelineStage('Unknown')).toBe('Unknown');
    });
  });
});

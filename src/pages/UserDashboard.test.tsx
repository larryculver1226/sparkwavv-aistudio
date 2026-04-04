import { describe, it, expect } from 'vitest';
import { getTimelineStage } from './UserDashboard';

describe('UserDashboard Utilities', () => {
  describe('getTimelineStage', () => {
    it('should map Dive-In-related stages correctly', () => {
      expect(getTimelineStage('Dive-In')).toBe('Dive-In');
      expect(getTimelineStage('dive-in')).toBe('Dive-In');
    });

    it('should map Ignition-related stages correctly', () => {
      expect(getTimelineStage('Ignition')).toBe('Ignition');
      expect(getTimelineStage('ignition')).toBe('Ignition');
    });

    it('should map Discovery-related stages correctly', () => {
      expect(getTimelineStage('Discovery')).toBe('Discovery');
      expect(getTimelineStage('discovery')).toBe('Discovery');
      expect(getTimelineStage('search')).toBe('Discovery');
    });

    it('should map Branding-related stages correctly', () => {
      expect(getTimelineStage('Branding')).toBe('Branding');
      expect(getTimelineStage('branding')).toBe('Branding');
      expect(getTimelineStage('map')).toBe('Branding');
    });

    it('should map Outreach-related stages correctly', () => {
      expect(getTimelineStage('Outreach')).toBe('Outreach');
      expect(getTimelineStage('outreach')).toBe('Outreach');
      expect(getTimelineStage('match')).toBe('Outreach');
    });

    it('should return the original string if no mapping exists', () => {
      expect(getTimelineStage('Unknown')).toBe('Unknown');
    });
  });
});

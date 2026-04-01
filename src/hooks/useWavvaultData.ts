import { useState, useEffect } from 'react';
import { ValidationGateEvent, DistilledArtifact } from '../types/wavvault';
import { wavvaultService } from '../services/wavvaultService';
import { useIdentity } from '../contexts/IdentityContext';

export const useWavvaultData = () => {
  const { user, status } = useIdentity();
  const [events, setEvents] = useState<ValidationGateEvent[]>([]);
  const [artifacts, setArtifacts] = useState<DistilledArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !user) {
      if (status === 'unauthenticated') {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeEvents = wavvaultService.subscribeToEvents(
      user.uid,
      (eventData) => {
        setEvents(eventData);
      },
      (err) => {
        setError("Failed to load journey events.");
      }
    );

    const unsubscribeArtifacts = wavvaultService.subscribeToArtifacts(
      user.uid,
      (artifactData) => {
        setArtifacts(artifactData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load distilled artifacts.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeArtifacts();
    };
  }, [user, status]);

  return {
    events,
    artifacts,
    loading,
    error,
    userId: user?.uid || ''
  };
};

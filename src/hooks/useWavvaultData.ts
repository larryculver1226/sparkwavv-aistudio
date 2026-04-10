import { useState, useEffect } from 'react';
import { ValidationGateEvent, DistilledArtifact, WavvaultData } from '../types/wavvault';
import { wavvaultService } from '../services/wavvaultService';
import { useIdentity } from '../contexts/IdentityContext';
import { skylar } from '../services/skylarService';

export const useWavvaultData = () => {
  const { user, status } = useIdentity();
  const [events, setEvents] = useState<ValidationGateEvent[]>([]);
  const [artifacts, setArtifacts] = useState<DistilledArtifact[]>([]);
  const [wavvaultData, setWavvaultData] = useState<WavvaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFullData = async () => {
    if (!user) return;
    try {
      const data = await skylar.getWavvaultData(user.uid);
      setWavvaultData(data);
    } catch (err) {
      console.error('Failed to fetch full WavvaultData', err);
    }
  };

  useEffect(() => {
    if (status !== 'ready' || !user) {
      if (status === 'unauthenticated') {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    fetchFullData();

    const unsubscribeEvents = wavvaultService.subscribeToEvents(
      user.uid,
      (eventData) => {
        setEvents(eventData);
      },
      (err) => {
        setError('Failed to load journey events.');
      }
    );

    const unsubscribeArtifacts = wavvaultService.subscribeToArtifacts(
      user.uid,
      (artifactData) => {
        setArtifacts(artifactData);
        setLoading(false);
      },
      (err) => {
        setError('Failed to load distilled artifacts.');
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
    wavvaultData,
    loading,
    error,
    userId: user?.uid || '',
    refreshWavvaultData: fetchFullData,
  };
};

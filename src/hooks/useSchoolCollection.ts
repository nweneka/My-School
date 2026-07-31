import { useEffect, useState } from 'react';
import { collection, onSnapshot, type QueryConstraint, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Subscribes to schools/{schoolId}/{collectionName} in real time.
 * Every school-scoped collection in the app goes through this one hook,
 * so there's a single place that enforces "always nested under schoolId".
 */
export function useSchoolCollection<T>(
  schoolId: string | undefined,
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setData([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'schools', schoolId, collectionName),
      ...constraints
    );
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[]);
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, collectionName]);

  return { data, loading };
}

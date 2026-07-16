import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PERIOD_KEYS, type PeriodKey } from '../types/dashboard';

const DEFAULT_PERIOD: PeriodKey = 'month';

function isPeriodKey(value: string | null): value is PeriodKey {
  return value !== null && (PERIOD_KEYS as readonly string[]).includes(value);
}

export function usePeriodParam(): [PeriodKey, (next: PeriodKey) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period: PeriodKey = isPeriodKey(raw) ? raw : DEFAULT_PERIOD;

  const setPeriod = useCallback(
    (next: PeriodKey) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          if (next === DEFAULT_PERIOD) {
            out.delete('period');
          } else {
            out.set('period', next);
          }
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [period, setPeriod];
}

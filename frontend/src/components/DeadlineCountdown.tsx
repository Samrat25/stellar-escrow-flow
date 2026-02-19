import { useEffect, useState } from 'react';
import { getDeadlineRemaining } from '@/lib/stellar';

const DeadlineCountdown = ({ deadline }: { deadline: string }) => {
  const [remaining, setRemaining] = useState(getDeadlineRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getDeadlineRemaining(deadline));
    }, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining.expired) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-destructive text-sm font-medium">
        ⏰ Deadline Expired — Auto-release eligible
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {[
        { label: 'Days', value: remaining.days },
        { label: 'Hours', value: remaining.hours },
        { label: 'Min', value: remaining.minutes },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="text-2xl font-bold font-mono text-primary">{String(unit.value).padStart(2, '0')}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{unit.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DeadlineCountdown;

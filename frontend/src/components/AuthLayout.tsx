import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { IconExercises, IconRecords, IconTrend } from './icons';

const FEATURES = [
  { Icon: IconExercises, text: 'A catalog of lifts plus any custom movement you name.' },
  { Icon: IconTrend, text: 'Weekly volume, streaks, and a muscle split you can actually read.' },
  { Icon: IconRecords, text: 'Personal records and estimated one-rep maxes, tracked over time.' },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth__hero">
        <Logo />
        <div>
          <h1 className="auth__headline">
            Track the work. Watch the <em>iron</em> move.
          </h1>
          <p className="auth__lede">
            Every set, rep, and plate in one place, so progress is a chart instead of a guess.
          </p>
        </div>
        <ul className="auth__features">
          {FEATURES.map(({ Icon, text }) => (
            <li className="auth__feature" key={text}>
              <Icon size={18} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="auth__panel">{children}</section>
    </div>
  );
}

import { useState } from 'react';
import { Modal } from './Modal';

export const DEMO_EMAIL = 'demo@ironlog.dev';
export const DEMO_PASSWORD = 'demo-password-123';

const SEEN_KEY = 'ironlog.demoModalSeen';

function hasSeenDemo(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    // Storage can be blocked (private mode, disabled site data). Show the modal then.
    return false;
  }
}

function markDemoSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Nothing to do: the modal may appear again on the next visit.
  }
}

export function DemoAccountModal() {
  const [open, setOpen] = useState(() => !hasSeenDemo());

  const close = () => {
    markDemoSeen();
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Try IronLog with a demo account"
      footer={
        <button className="btn btn--primary" onClick={close} type="button">
          Got it
        </button>
      }
    >
      <p className="dim">
        Sign in with the shared demo account to explore the app without creating one. It already has a few
        weeks of training history so the charts have something to show.
      </p>
      <dl className="demo-creds">
        <dt>Email</dt>
        <dd>
          <code>{DEMO_EMAIL}</code>
        </dd>
        <dt>Password</dt>
        <dd>
          <code>{DEMO_PASSWORD}</code>
        </dd>
      </dl>
      <p className="dim demo-note">
        The account is shared, so anyone signed in can change or delete its workouts. Please don't enter
        personal information, and create your own account if you want to keep your data.
      </p>
    </Modal>
  );
}

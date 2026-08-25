import { Role } from '@tunefour/shared-types';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720 }}>
      <h1>Tunefour Admin</h1>
      <p>Digital signage administration portal — Phase 0 scaffold.</p>
      <p>RBAC roles available (from @tunefour/shared-types):</p>
      <ul>
        {Object.values(Role).map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
    </main>
  );
}

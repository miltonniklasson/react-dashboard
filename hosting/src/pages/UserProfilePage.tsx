import { UserProfilePanel } from "../components/UserProfilePanel";

export function UserProfilePage() {
  return (
    <div className="profile-page">
      <div className="page-header">
        <h2 className="page-title">Your Profile</h2>
        <p className="page-sub">Manage your personal account information.</p>
      </div>
      <UserProfilePanel />
    </div>
  );
}

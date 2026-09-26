import { BoardBanner } from '../board-banner/BoardBanner';
import { Menu } from '../menu/Menu';
import { Sidenav } from '../sidenav/Sidenav';
import './Home.css';

/**
 * Ported from armature-ui's HomeComponent. The original constructor also
 * kicked off UserDataStoreService/ScheduleDataStoreService loads (backing
 * the "driver"/"qc"/"lead"/"lunch" dynamic-form dropdown options) — those
 * two stores aren't ported yet, so those specific dropdown-driven options
 * stay empty for now rather than blocking the rest of the app.
 */
export function Home() {
  return (
    <div className="home-root">
      <Menu />
      <BoardBanner />
      <div className="home-sidenav-wrapper">
        <Sidenav />
      </div>
    </div>
  );
}

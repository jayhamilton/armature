import { BoardBanner } from '../board-banner/BoardBanner';
import { Menu } from '../menu/Menu';
import { Sidenav } from '../sidenav/Sidenav';
import './Home.css';

/** Ported from armature-ui's HomeComponent. */
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

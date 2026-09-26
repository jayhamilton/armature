import { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { environment } from 'src/environments/environment';
import { authenticationService } from '../_authentication/authentication.service';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import './Login.css';

/** Ported from armature-ui's LoginComponent. */
export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showMessage, setShowMessage] = useState(false);

  function routeTo(path: string) {
    navigate(path);
  }

  function setDemoData(name: string, demoPassword: string) {
    const demoData = {
      message: 'authenticated',
      status: 'OK',
      user: { name: 'admin', roles: [{ authority: 'ROLE_ADMIN' }] },
    };
    sessionStorage.setItem('PRINCIPAL', JSON.stringify(demoData));
    sessionStorage.setItem(environment.sessionToken, 'Basic ' + btoa(`${name}:${demoPassword}`));
    routeTo('/home');
  }

  function authenticate(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return;

    const user = { userName: username, password };

    if (environment.demo) {
      setDemoData('testuser', 'testpassword');
      return;
    }

    authenticationService.authenticate(user).subscribe({
      next: (answer: any) => {
        if (answer['status'] === 'OK') {
          sessionStorage.setItem(environment.sessionToken, 'Basic ' + btoa(`${user.userName}:${user.password}`));
          setShowMessage(false);
          sessionStorage.setItem('PRINCIPAL', JSON.stringify(answer));
          routeTo('/home');
        } else {
          sessionStorage.setItem('session', '');
          setShowMessage(true);
        }
      },
      error: () => {
        sessionStorage.setItem('session', '');
        setShowMessage(true);
      },
    });
  }

  return (
    <div className="login-page">
      <Card variant="outlined" className="login-card">
        <div className="login-brand">
          <MatIcon>space_dashboard</MatIcon>
        </div>

        <Typography className="login-title">Armature</Typography>
        <p className="login-subtitle">Sign in to continue</p>

        <CardContent>
          <form onSubmit={authenticate}>
            <TextField
              fullWidth
              variant="outlined"
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-field"
            />

            <TextField
              fullWidth
              variant="outlined"
              type="password"
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-field"
            />

            {showMessage && (
              <div className="login-error">
                <MatIcon>error_outline</MatIcon>
                <span>Username or password is incorrect.</span>
              </div>
            )}

            <div className="login-actions">
              <Button type="submit" color="primary" variant="contained">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

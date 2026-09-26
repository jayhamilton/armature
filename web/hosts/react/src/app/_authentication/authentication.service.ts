import { from, type Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

class AuthenticationServiceImpl {
  apiEndPoint = environment.apihost + environment.loginAPI;

  authenticate(user: { userName: string; password: string }): Observable<any> {
    const headers = {
      Authorization: 'Basic ' + btoa(`${user.userName}:${user.password}`),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const body = { title: 'React POST Request Example' };

    return from(
      fetch(this.apiEndPoint, { method: 'POST', headers, body: JSON.stringify(body) }).then((res) => res.json())
    );
  }
}

export const authenticationService = new AuthenticationServiceImpl();

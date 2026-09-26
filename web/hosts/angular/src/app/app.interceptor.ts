// src/app/auth/token.interceptor.ts
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from './_authentication/authentication.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(public auth: AuthenticationService) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    //don't add headers for api requests such as file upload.
    if (request.headers.get('skip')) {
      return next.handle(request);
    }

    let token = sessionStorage.getItem(environment.sessionToken);
    if (token) {
      const headers: Record<string, string> = {
        Authorization: token,
        'Content-type': 'application/json',
      };
      // Don't clobber a caller-specified Accept (e.g. the agent chat stream needs
      // text/event-stream) - forcing application/json here made the streaming
      // endpoint 406 for any logged-in user, since its @PostMapping only produces
      // text/event-stream and Spring's content negotiation rejects the mismatch.
      if (!request.headers.has('Accept')) {
        headers['Accept'] = 'application/json';
      }
      request = request.clone({ setHeaders: headers });
    }
    return next.handle(request);
  }
}

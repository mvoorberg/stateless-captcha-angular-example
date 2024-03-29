import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";

/**
 * Generic implementation of calls to the API. It supports making
 * CRUD style calls and calls to custom back-end functions.
 *
 * Each call response is routed through a centralized response handler
 * to facilitate error handling in the application.
 * E.g. Handling authentication errors from expired tokens can be
 *      implemented in one place.
 *
 * This API client is the authentication service for the API back-end, adding the
 * necessary headers.  It implements the canActivate interface for the route guards.
 */
@Injectable({
  providedIn: "root"
})
export class TransomApiClientService  {
  public baseUrl: string;
  private headers: any;

  constructor(public http: HttpClient) {
    this.baseUrl = "/api/v1";
    this.headers = {};
  }
  
  setHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  /**
   * Generic API response handler. Passes the response on to the orginal caller
   * and catches any errors as needed using the catchError operator (rxjs).
   *
   * @param responseObs The generic response Observable of any API call
   */
  handleResponse(responseObs: Observable<any>): Observable<any> {
    return responseObs.pipe(
      map((res: Response) => {
        let retval: any = res;

        // Results that include multiple documemts are packaged in an envelope with a data property.
        if (retval.data) {
          retval = retval.data;
        }
        return retval;
      }),
      catchError((err: HttpErrorResponse, caught: Observable<any>) => this.handleHttpError(err, caught))
    );
  }

  /**
   * The implementation of general error handling is fairly rudimentary. Any 401 response is
   * assumed to mean that the token is expired and we're not logged in anymore. (Valid in this particular
   * app, but would need to be evaluated if developed further).
   * Any connectivity error is thrown as a hard error, as there is no graceful handling to operate in a disconnected state.
   *
   * The application does not provide a means for notifying the user of generic errors (E.g. drawer or toast)
   * therefore those errors are simply logged to the console.
   *
   * @param error the error response
   * @param responseObs the caught Observable with the error.
   */
  handleHttpError(error: HttpErrorResponse, responseObs?: Observable<any>) {
    if (error) {
      throw error;
    }
    return of([]);
  }

  // ******** CUSTOM Backend FUNCTIONS ******************

  /**
   * Makes a post request to the custom submit Request function and returns the result.
   *
   * @param functionName The name of the API function to call, as defined in
   * the functions object of apiDefinition.js (line 122)
   * @param body The body to post to the request.
   */
  postMultipartRequest(contactRequest: any): Observable<any> {
    const functionName = "submitContactRequest";
    const url = this.baseUrl + `/fx/${functionName}`;

    const body: FormData = new FormData();
    body.append("requestData", JSON.stringify(contactRequest));
    for (let i = 0; i < contactRequest.attachments.length; i++) {
      const f: File = contactRequest.attachments[i];
      body.append("file" + i, f);
    }

    const obs = this.http.post(url, body, {
      headers: this.headers
    });
    return this.handleResponse(obs);
  }

  postRequest(body: any): Observable<any> {
    const functionName = "submitContactRequest";
    const url = this.baseUrl + `/fx/${functionName}`;
    const obs = this.http.post(url, body, {
      headers: this.headers
    });
    return this.handleResponse(obs);
  }

}

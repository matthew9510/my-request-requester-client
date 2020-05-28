import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { EventService } from "../../services/event.service";
import { forkJoin } from "rxjs";
import { map, mergeMap, take } from "rxjs/operators";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"],
})
export class HistoryComponent implements OnInit {
  eventIds: any;
  history = [];
  loading: boolean = true;
  displayedColumns: string[] = [
    "modifiedOn",
    "song",
    "artist",
    "status",
    "amount",
  ];
  noRequesterHistory: boolean = false;

  constructor(private http: HttpClient, private eventService: EventService) {}

  ngOnInit() {
    this.onGetRequesterHistory();
  }

  onGetRequesterHistory() {
    this.getRequesterHistory().subscribe((res: any) => {
      if (res.response.statusCode === 204) {
        this.loading = false;
        this.noRequesterHistory = true;
      } else {
        let eventIds = [];
        for (let request of res.response.body) {
          eventIds.push(request.eventId);
        }
        this.eventIds = new Set(eventIds);
        for (let id of this.eventIds) {
          this.getEventInfo(id);
        }
      }
    }),
      (err) => {
        console.log(err);
      };
  }

  getEventInfo(eventId: string) {
    const eventUrl = this.http.get(`${environment.eventsUrl}/${eventId}`, {});
    const requestsUrl = this.http.get(
      `${environment.requesterUrl}/${localStorage.getItem(
        environment.cognitoIdentityId
      )}/requests?eventId=${eventId}`
    );

    forkJoin([eventUrl, requestsUrl])
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          let newEvent = {
            info: res[0].response.body.Item,
            requests: res[1].response.body,
            totalAmount: res[1].response.body.reduce(
              (total, amount, index, array) => {
                total += amount["amount"];
                return total;
              },
              0
            ),
          };
          this.history.push(newEvent);
        },
        (err) => {
          console.log(err);
          this.loading = false;
        }
      );
    this.loading = false;
    // console.log(this.history);
  }

  getRequesterHistory() {
    return this.http.get(
      `${environment.requesterUrl}/${localStorage.getItem(
        environment.cognitoIdentityId
      )}/requests`
    );
  }
}

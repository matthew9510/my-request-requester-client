import { AmplifyAngularModule, AmplifyService } from "aws-amplify-angular";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RequestsComponent } from "./components/requests/requests.component";
import { RequestDetailsComponent } from "./components/request-details/request-details.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MakeRequestComponent } from "./components/make-request/make-request.component";
import { TranslocoRootModule } from "./transloco-root.module";
import { LayoutModule } from "@angular/cdk/layout";
import { SearchEventsComponent } from "./components/search-events/search-events.component";
import { EventDetailsComponent } from "./components/event-detail/event-detail.component";
import { EventOverviewComponent } from "./components/event-overview/event-overview.component";
import { HistoryComponent } from "./components/history/history.component";
import { ErrorPageComponent } from "./components/error-page/error-page.component";
import { FilterPipe } from "./pipes/filter.pipe";
import { CurrencyPipe } from "@angular/common";
import {
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatChipsModule,
  MatCardModule,
  MatGridListModule,
  MatTabsModule,
  MatListModule,
  MatDialogModule,
  MatDatepickerModule,
  MatStepperModule,
  MatProgressBarModule,
  MatSnackBarModule,
  MatMenuModule,
  MatExpansionModule,
  MatTableModule,
  MatProgressSpinnerModule,
  MatBadgeModule,
} from "@angular/material";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { FormsModule } from "@angular/forms";
import { BottomNavComponent } from "./components/bottom-nav/bottom-nav.component";
import { HeaderComponent } from "./components/header/header.component";
import { DebounceClickDirective } from "./directives/debounce-click.directive";
import { OrderModule } from "ngx-order-pipe";
import { StripePaymentFormComponent } from "./components/stripe-payment-form/stripe-payment-form.component";
import { EndUserLicenseAgreementComponent } from "./components/end-user-license-agreement/end-user-license-agreement.component";
import { CustomScrollDirective } from "./directives/custom-scroll.directive";
import { CopyrightComponent } from "./components/copyright/copyright.component";
import { TwitchStreamComponent } from "./components/twitch-stream/twitch-stream.component";
import { SafePipe } from "./pipes/safe.pipe";

@NgModule({
  declarations: [
    AppComponent,
    RequestsComponent,
    RequestDetailsComponent,
    MakeRequestComponent,
    SearchEventsComponent,
    EventDetailsComponent,
    FilterPipe,
    BottomNavComponent,
    HeaderComponent,
    EventOverviewComponent,
    HistoryComponent,
    ErrorPageComponent,
    DebounceClickDirective,
    StripePaymentFormComponent,
    EndUserLicenseAgreementComponent,
    CustomScrollDirective,
    CopyrightComponent,
    TwitchStreamComponent,
    SafePipe,
  ],
  imports: [
    AmplifyAngularModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    TranslocoRootModule,
    MatButtonModule,
    MatListModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatGridListModule,
    MatToolbarModule,
    MatDialogModule,
    LayoutModule,
    MatDatepickerModule,
    ScrollingModule,
    MatStepperModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatMenuModule,
    MatExpansionModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    OrderModule,
  ],
  entryComponents: [EndUserLicenseAgreementComponent],
  providers: [AmplifyService, FilterPipe, CurrencyPipe, SafePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}

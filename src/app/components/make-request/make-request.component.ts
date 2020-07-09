import {
  Component,
  OnInit,
  Inject,
  ErrorHandler,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from "@angular/forms";
import { RequestsService } from "../../services/requests.service";
import { StripeService } from "../../services/stripe.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { translate } from "@ngneat/transloco";
import { environment } from "@ENV";

@Component({
  selector: "app-make-request",
  templateUrl: "./make-request.component.html",
  styleUrls: ["./make-request.component.scss"],
})
export class MakeRequestComponent implements OnInit, AfterViewInit {
  requestForm: FormGroup;
  loading = false;
  success = false;
  showSubmitErrorMessage: boolean = false;
  submitErrorMessage: string;
  title: string;
  isTopUp: boolean;
  displayNextPage: boolean = false;
  stepOfRequestForm: number = 1;

  // for setting autofocus on inputs
  private targetId = "input0";
  private autoFocusElements: any;
  @ViewChild("input0", { static: false }) input0: ElementRef;
  @ViewChild("input1", { static: false }) input1: ElementRef;
  @ViewChild("input2", { static: false }) input2: ElementRef;

  // Stripe dependencies
  @ViewChild("stripe", { static: false }) stripe;
  performerStripeId;

  constructor(
    private fb: FormBuilder,
    private requestService: RequestsService,
    private stripeService: StripeService,
    public dialogRef: MatDialogRef<MakeRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (sessionStorage.getItem("firstName") == undefined) {
      sessionStorage.setItem("firstName", "");
    }
    if (sessionStorage.getItem("lastName") == undefined) {
      sessionStorage.setItem("lastName", "");
    }
  }

  ngAfterViewInit(): void {
    // initialize to assist setting autofocus on inputs
    this.autoFocusElements = {
      input0: this.input0,
      input1: this.input1,
      input2: this.input2,
    };
  }

  ngOnInit() {
    this.isTopUp = this.data.isTopUp;
    this.title = this.data.dialogTitle;
    this.requestForm = this.fb.group({
      song: ["", [Validators.required]],
      artist: [null],
      amount: [
        null,
        [
          Validators.pattern(/^[0-9]\d{0,9}(\.\d{1,2})?%?$/),
          Validators.min(1),
          Validators.required,
        ],
      ],
      memo: [""],
      eventId: this.data.eventId,
      performerId: this.data.performerId,
      originalRequestId: [null],
      status: ["pending"],
      requesterId: [
        localStorage.getItem(this.requestService.cognitoIdentityStorageKey),
      ],
      // type: ["Not Sure on value"],
      firstName: [sessionStorage.getItem("firstName")],
      lastName: [sessionStorage.getItem("lastName")],
      stripe: [null, Validators.required],
    });
    this.requestForm.patchValue(this.data);
    this.requestForm.valueChanges.subscribe((x) => {
      if (this.requestForm.value.firstName !== null) {
        sessionStorage.setItem("firstName", this.requestForm.value.firstName);
      }
      if (this.requestForm.value.lastName !== null) {
        sessionStorage.setItem("lastName", this.requestForm.value.lastName);
      }
    });
    this.requestForm.valueChanges.subscribe((x) => {
      if (this.requestForm.value.amount === null) {
        this.requestForm.value.amount = 0;
      }
    });
    this.performerStripeId = this.data.performerStripeId;
  }

  resetForm() {
    this.requestForm = this.fb.group({
      song: ["", [Validators.required]],
      artist: [null],
      amount: [null],
      memo: [""],
      eventId: this.data.eventId,
      performerId: this.data.performerId,
      originalRequestId: [null],
      status: ["pending"],
      requesterId: [
        localStorage.getItem(this.requestService.cognitoIdentityStorageKey),
      ],
      // type: ["Not Sure on value"],
      firstName: [sessionStorage.getItem("firstName")],
      lastName: [sessionStorage.getItem("lastName")],
    });
  }

  confirmDialog() {
    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  get song() {
    return this.requestForm.get("song");
  }

  get artist() {
    return this.requestForm.get("artist");
  }

  get firstName() {
    return this.requestForm.get("firstName");
  }

  get lastName() {
    return this.requestForm.get("lastName");
  }

  get amount() {
    return this.requestForm.get("amount");
  }

  submitHandler() {
    this.loading = true;
    // create payment Intent if free event do make request
    // if not free event call some other function to hit stripe endpoint
    // this.makeRequest();
    this.makePaidRequest();
  }

  makeRequest() {
    this.requestForm.value.amount = Number(this.requestForm.value.amount);
    this.requestService.makeRequest(this.requestForm.value).subscribe(
      (res) => {
        // console.log(res);
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.dialogRef.close(true);
        }, 8000);
      },
      (err) => {
        console.log(err);
        this.errorHandler(err);
        this.success = false;
        this.showSubmitErrorMessage = true;
        this.loading = false;
      }
    );
  }

  makePaidRequest() {
    this.requestForm.value.amount = Number(this.requestForm.value.amount);

    let paidRequestObject = Object.assign({}, this.requestForm.value);

    let transaction$ = this.stripe.submitCardPayment(
      this.performerStripeId,
      paidRequestObject
    );

    transaction$.subscribe(
      (res: any) => {
        // change component flags
        this.loading = false;
        this.success = true;

        // save the stripe ClientID
        console.log(res);
        console.log(res.stripeClientSecret);

        setTimeout(() => {
          this.dialogRef.close(true);
        }, 8000);
      },
      (err) => {
        console.log(err);
        this.errorHandler(err);
        this.success = false;
        this.showSubmitErrorMessage = true;
        this.loading = false;
      }
    );
  }

  // runs when the stripe element input is altered in any way
  removeStripeControl(isStripeValid: Boolean) {
    if (isStripeValid) {
      return this.requestForm.removeControl("stripe"); // why are we doing this? because we don't want access to the secure info if we dont need to??
    }
    if (!this.requestForm.get("stripe")) {
      // if the element is changed after being valid capture that data (but we are not even technically 'capturing it, we are just making sure it is required?)
      return this.requestForm.addControl(
        "stripe",
        new FormControl(null, Validators.required)
      );
    }
    return;
  }

  errorHandler(err: { status: number }) {
    if (err.status === 422) {
      this.submitErrorMessage = translate("422 error message");
    } else {
      this.submitErrorMessage = translate("general error message");
    }
  }

  decrementFormStep() {
    this.stepOfRequestForm -= 1;
  }

  incrementFormStep() {
    this.stepOfRequestForm += 1;
  }

  /* These two methods below set autofocus on the first input of each step of the stepper */
  setFocus() {
    let targetElem: { nativeElement: { focus: () => void } }; // target appropriate viewchild using targetId

    // assign the target element accordingly
    if (this.targetId === "input2") {
      targetElem = this.autoFocusElements[this.targetId]._elementRef;
    } else {
      targetElem = this.autoFocusElements[this.targetId];
    }

    // set focus on the element
    targetElem.nativeElement.focus();
  }

  setTargetId(event: any) {
    this.targetId = `input${event.selectedIndex}`;
  }
}

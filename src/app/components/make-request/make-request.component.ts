import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ElementRef,
  AfterContentInit,
  ViewEncapsulation,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from "@angular/forms";
import { RequestsService } from "../../services/requests.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { translate } from "@ngneat/transloco";
import { MinimumRequestAmount } from "../../validators/request-min-amount-validator";
import { MinimumTipAmount } from "../../validators/tip-min-amount-validator";
import { MaximumRequestAmount } from "../../validators/request-max-amount-validator";
import { PaidRequestsOnlyMinimumRequestAmount } from "../../validators/paid-requests-only-amount-validator";
import { StripeService } from "@services/stripe.service";
import { PerformerService } from "@services/performer.service";
import { RequesterService } from "@services/requester.service";

@Component({
  selector: "app-make-request",
  templateUrl: "./make-request.component.html",
  styleUrls: ["./make-request.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MakeRequestComponent implements OnInit, AfterContentInit {
  isPaidRequestsOnly: boolean;
  requestInfoForm: FormGroup;
  tipForm: FormGroup;
  requestPaymentForm: FormGroup;
  acknowledgementOfMerchantForm: FormGroup;
  requesterAcknowledgedMerchant: boolean;
  isPerformerSignedUp: boolean;
  isPaidRequest: boolean = false;
  loading = false;
  success = false;
  showSubmitErrorMessage: boolean = false;
  submitErrorMessage: string;
  title: string;
  isTopUp: boolean;
  displayNextPage: boolean = false;
  requestFormNumber: number = 1;
  tabSelected: string = "request";
  requestTabDisabled: boolean = false;
  tipTabDisabled: boolean = false;

  // for focusing on desired inputs
  @ViewChild("songInput", { static: false }) songInput: ElementRef;
  @ViewChild("amountInput", { static: false }) amountInput: ElementRef;

  // Stripe dependencies
  @ViewChild("stripe", { static: false }) stripe;
  performerStripeId;
  constructor(
    private fb: FormBuilder,
    private requestService: RequestsService,
    public stripeService: StripeService,
    public performerService: PerformerService,
    public dialogRef: MatDialogRef<MakeRequestComponent>,
    public requesterService: RequesterService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (sessionStorage.getItem("firstName") == undefined) {
      sessionStorage.setItem("firstName", "");
    }
    if (sessionStorage.getItem("lastName") == undefined) {
      sessionStorage.setItem("lastName", "");
    }
  }

  ngAfterContentInit() {
    if (this.isTopUp) {
      setTimeout(() => this.amountInput.nativeElement.focus(), 500);
    } else {
      setTimeout(() => this.songInput.nativeElement.focus(), 500);
    }
  }

  ngOnInit() {
    this.isPaidRequestsOnly = this.data.isPaidRequestsOnly;
    this.isTopUp = this.data.isTopUp;
    this.title = this.data.dialogTitle;
    this.performerStripeId = this.data.performerStripeId;

    this.requestInfoForm = this.fb.group({
      song: ["", [Validators.required]],
      artist: [null],
      amount: [""],
      memo: [""],
      eventId: this.data.eventId,
      performerId: this.data.performerId,
      originalRequestId: [null],
      status: ["pending"],
      requesterId: [
        localStorage.getItem(this.requesterService.cognitoIdentityStorageKey),
      ],
      firstName: [sessionStorage.getItem("firstName")],
      lastName: [sessionStorage.getItem("lastName")],
    });

    // if the performer isn't signed up with stripe
    if (!this.performerService.isPerformerSignedUpWithStripe) {
      // set flag to hide the amount form field as well as hard code the value
      // to 0 to have the app work for free requests
      this.requestInfoForm.controls["amount"].setValue("0");
    }

    // Create payment form
    this.requestPaymentForm = this.fb.group({
      stripe: [null, Validators.required],
    });

    // Create tip form
    this.tipForm = this.fb.group({
      isTip: [true],
      amount: [
        "",
        [
          Validators.required,
          MinimumTipAmount(this.stripeService.minimumRequestAmount.toString()),
          MaximumRequestAmount(
            this.stripeService.maximumRequestAmount.toString()
          ),
        ],
      ],
      memo: [""],
      eventId: this.data.eventId,
      performerId: this.data.performerId,
      originalRequestId: [null],
      status: ["completed"],
      requesterId: [
        localStorage.getItem(this.requesterService.cognitoIdentityStorageKey),
      ],
      firstName: [null],
      lastName: [null],
    });

    // load form with data passed in
    this.requestInfoForm.patchValue(this.data);

    // if topup disable certain form fields from being manipulated
    if (this.isTopUp) {
      this.requestInfoForm.controls["song"].disable();
      this.requestInfoForm.controls["artist"].disable();
      this.requestInfoForm.controls["memo"].disable();
    }

    // set appropriate validators
    if (this.isPaidRequestsOnly || this.isTopUp) {
      this.requestInfoForm.controls["amount"].setValidators([
        PaidRequestsOnlyMinimumRequestAmount(
          this.stripeService.minimumRequestAmount.toString()
        ),
        MaximumRequestAmount(
          this.stripeService.maximumRequestAmount.toString()
        ),
      ]);
    } else {
      this.requestInfoForm.controls["amount"].setValidators([
        MinimumRequestAmount(
          this.stripeService.minimumRequestAmount.toString()
        ),
        MaximumRequestAmount(
          this.stripeService.maximumRequestAmount.toString()
        ),
      ]);
    }

    this.requestInfoForm.controls["amount"].updateValueAndValidity();

    this.requestInfoForm.valueChanges.subscribe((x) => {
      if (this.requestInfoForm.value.firstName !== null) {
        sessionStorage.setItem(
          "firstName",
          this.requestInfoForm.value.firstName
        );
      }
      if (this.requestInfoForm.value.lastName !== null) {
        sessionStorage.setItem("lastName", this.requestInfoForm.value.lastName);
      }

      if (
        Number(this.requestInfoForm.value.amount) >=
        this.stripeService.minimumRequestAmount
      ) {
        this.isPaidRequest = true;
      } else {
        this.isPaidRequest = false;
      }
    });

    if (
      localStorage.getItem("requesterAcknowledgedMerchant") === null ||
      localStorage.getItem("requesterAcknowledgedMerchant") === "false"
    ) {
      this.requesterAcknowledgedMerchant = false;
      // Form for requester acknowledging that the funds go straight to the performer not the My Request platform
      this.acknowledgementOfMerchantForm = this.fb.group({
        acknowledgementOfMerchant: [false, [Validators.requiredTrue]],
      });
    } else {
      this.requesterAcknowledgedMerchant = true;
    }
  }

  confirmDialog() {
    this.dialogRef.close(true);
  }

  closeDialog() {
    if (this.stripeService.isStripePaymentMethodError === true) {
      this.stripeService.isStripePaymentMethodError = false;
      this.stripeService.originalPaymentIntentId = "";
      this.submitErrorMessage = "";
    }

    // this has to check if it was a successful topup
    if (this.isTopUp && this.success) {
      this.dialogRef.close({ isSuccessfulTopUp: true });
    } else {
      this.dialogRef.close({ isSuccessfulTopUp: false });
    }
  }

  get song() {
    return this.requestInfoForm.get("song");
  }

  get artist() {
    return this.requestInfoForm.get("artist");
  }

  get firstName() {
    return this.requestInfoForm.get("firstName");
  }

  get lastName() {
    return this.requestInfoForm.get("lastName");
  }

  get amount() {
    return this.requestInfoForm.get("amount");
  }

  get tipAmount() {
    return this.tipForm.get("amount");
  }

  submitHandler() {
    // show spinner
    this.loading = true;
    // if previous error message was presented hide it
    this.showSubmitErrorMessage = false;
    // tip
    if (
      !this.isTopUp &&
      this.performerService.isPerformerSignedUpWithStripe &&
      this.tabSelected === "tip"
    ) {
      this.requestTabDisabled = true;
      this.tipPerformer();
    } else if (this.isPaidRequestsOnly || this.isPaidRequest) {
      this.tipTabDisabled = true;
      this.makePaidRequest();
    } else {
      this.tipTabDisabled = true;
      this.makeFreeRequest();
    }
  }

  makeFreeRequest() {
    //convert amount value from empty string to a number 0
    let freeRequestObject = Object.assign(
      {},
      this.requestInfoForm.getRawValue()
    );
    freeRequestObject.amount = 0;

    this.requestService.makeRequest(freeRequestObject).subscribe(
      (res) => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.dialogRef.close({ isSuccessfulTopUp: false });
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
    // if requester has not yet acknowledged the merchant
    if (
      localStorage.getItem("requesterAcknowledgedMerchant") === null ||
      localStorage.getItem("requesterAcknowledgedMerchant") === "false"
    ) {
      let requesterId = localStorage.getItem(
        this.requesterService.cognitoIdentityStorageKey
      );
      let acknowledgementOfMerchant = this.acknowledgementOfMerchantForm
        .controls.acknowledgementOfMerchant.value;

      let payload = { acknowledgementOfMerchant };

      this.requesterService
        .patchRequester(requesterId, payload)
        .subscribe((res: any) => {
          if (res.statusCode === 200) {
            this.requesterService.requester.acknowledgementOfMerchant =
              res.body.acknowledgementOfMerchant;

            //Assign local storage // save this to a service or localStorage for when the requester joins other events
            localStorage.setItem("requesterAcknowledgedMerchant", "true");
          }
        });
    }

    let paidRequestObject = Object.assign(
      {},
      this.requestInfoForm.getRawValue()
    );
    paidRequestObject.amount = Number(paidRequestObject.amount);

    const transaction$ = this.stripe.submitCardPayment(
      this.performerStripeId,
      paidRequestObject
    );

    transaction$.subscribe(
      (res: any) => {
        // change component flags
        this.loading = false;
        this.success = true;

        // clear the stripe error flow
        if (this.stripeService.isStripePaymentMethodError === true) {
          this.stripeService.isStripePaymentMethodError = false;
          this.stripeService.originalPaymentIntentId = "";
          this.submitErrorMessage = "";
        }

        if (this.isTopUp) {
          setTimeout(() => {
            this.dialogRef.close({ isSuccessfulTopUp: true });
          }, 6000);
        } else {
          setTimeout(() => {
            this.dialogRef.close({ isSuccessfulTopUp: false });
          }, 6000);
        }
      },
      (err) => {
        this.errorHandler(err);
        this.success = false;
        this.showSubmitErrorMessage = true;
        this.loading = false;
      }
    );
  }

  tipPerformer() {
    // clear the stripe error flow, tips will need to make a new payment intent
    // rather than update the unsuccessful payment intent due to the stripe flow.
    // Once the unsuccessful payment intent was attempted to be captured, the
    // token generated will never be able to be attempted to capture again.
    if (this.stripeService.isStripePaymentMethodError === true) {
      this.stripeService.isStripePaymentMethodError = false;
      this.stripeService.originalPaymentIntentId = "";
      this.submitErrorMessage = "";
    }

    // if requester has not yet acknowledged the merchant
    if (
      localStorage.getItem("requesterAcknowledgedMerchant") === null ||
      localStorage.getItem("requesterAcknowledgedMerchant") === "false"
    ) {
      let requesterId = localStorage.getItem(
        this.requesterService.cognitoIdentityStorageKey
      );
      let acknowledgementOfMerchant = this.acknowledgementOfMerchantForm
        .controls.acknowledgementOfMerchant.value;

      let payload = { acknowledgementOfMerchant };

      this.requesterService
        .patchRequester(requesterId, payload)
        .subscribe((res: any) => {
          if (res.statusCode === 200) {
            this.requesterService.requester.acknowledgementOfMerchant =
              res.body.acknowledgementOfMerchant;

            //Assign local storage // save this to a service or localStorage for when the requester joins other events
            localStorage.setItem("requesterAcknowledgedMerchant", "true");
          }
        });
    }

    let tipObject = Object.assign({}, this.tipForm.getRawValue());
    tipObject.amount = Number(tipObject.amount);

    const transaction$ = this.stripe.submitCardPayment(
      this.performerStripeId,
      tipObject
    );

    transaction$.subscribe(
      (res: any) => {
        // change component flags
        this.loading = false;
        this.success = true;

        // clear the stripe error flow
        if (this.stripeService.isStripePaymentMethodError === true) {
          this.stripeService.isStripePaymentMethodError = false;
          this.stripeService.originalPaymentIntentId = "";
          this.submitErrorMessage = "";
        }

        setTimeout(() => {
          this.dialogRef.close({ isSuccessfulTopUp: false });
        }, 8000);
      },
      (err) => {
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
      return this.requestPaymentForm.removeControl("stripe"); // why are we doing this? because we don't want access to the secure info if we dont need to??
    }
    if (!this.requestPaymentForm.get("stripe")) {
      // if the element is changed after being valid capture that data (but we are not even technically 'capturing it, we are just making sure it is required?)
      return this.requestPaymentForm.addControl(
        "stripe",
        new FormControl(null, Validators.required)
      );
    }
    return;
  }

  errorHandler(err: any) {
    if (err.status === 422) {
      this.submitErrorMessage = translate("422 error message");
    } else if (err.status === 402) {
      this.submitErrorMessage = err.error.errorMessage;
      this.stripeService.isStripePaymentMethodError = true;
      this.stripeService.originalPaymentIntentId =
        err.error.originalPaymentIntentId;
    } else {
      this.submitErrorMessage = translate("general error message");
    }
  }

  decrementFormStep() {
    this.requestFormNumber -= 1;
    if (this.isTopUp) {
      setTimeout(() => this.amountInput.nativeElement.focus(), 500);
    } else {
      setTimeout(() => this.songInput.nativeElement.focus(), 500);
    }
  }

  incrementFormStep() {
    this.requestFormNumber += 1;

    if (this.tabSelected === "request") {
      // Update the amount to be in decimal format
      let requestAmountFormControl = this.requestInfoForm.controls["amount"];
      if (
        Number(requestAmountFormControl.value) >=
        this.stripeService.minimumRequestAmount
      ) {
        requestAmountFormControl.setValue(
          Number(requestAmountFormControl.value).toFixed(2)
        );
      }
    } else {
      // for tips
      // Update the amount to be in decimal format
      let tipAmountFormControl = this.tipForm.controls["amount"];
      if (
        Number(tipAmountFormControl.value) >=
        this.stripeService.minimumRequestAmount
      ) {
        tipAmountFormControl.setValue(
          Number(tipAmountFormControl.value).toFixed(2)
        );
      }
    }
  }

  tabChange(event: number) {
    this.tabSelected = event === 0 ? "request" : "tip";
    this.requestFormNumber = 1;

    let requesterAcknowledgedMerchant = localStorage.getItem(
      "requesterAcknowledgedMerchant"
    );
    if (
      requesterAcknowledgedMerchant === null ||
      requesterAcknowledgedMerchant === "false"
    ) {
      // reset form value
      this.acknowledgementOfMerchantForm.controls[
        "acknowledgementOfMerchant"
      ].setValue(false);
    }
  }
}

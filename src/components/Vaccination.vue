<template>
  <div class="container">
    <preferences @preferenceChange="handlePreferenceChange"></preferences>
    <div class="row">
      <div class="col col-8">
        <div class="row">
          <h1>Schedule me for Pune</h1>
          <audio id="myAudio" controls>
            <source
              src="https://www.w3schools.com/jsref/horse.ogg"
              type="audio/ogg"
            />
            <source
              src="https://www.w3schools.com/jsref/horse.mp3"
              type="audio/mpeg"
            />
            Your browser does not support the audio element.
          </audio>
        </div>
        <div class="row">
          <a href="javascript:void(0)" @click="clear()">Clear</a>
          <a href="javascript:void(0)" @click="stop()" class="margin-left-20"
            >Pause</a
          >
          <a href="javascript:void(0)" @click="resume()" class="margin-left-20"
            >Resume</a
          >
        </div>
        <div class="row form-group" v-if="!this.phoneSubmitted">
          <input
            type="text"
            class="form-control-inline"
            name="phone"
            inputmode="numeric"
            v-model="phoneNumber"
            placeholder="phone number"
          />
          <button @click="handlePhoneSubmit()" class="btn-primary">
            Submit
          </button>
        </div>
        <div class="row form-group" v-if="phoneSubmitted">
          <input
            name="otp"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            class="form-control-inline"
            placeholder="OTP"
            v-model="otpValue"
          />
          <button @click="handleOnComplete()" :disabled="disableOtp">
            Start Booking
          </button>
        </div>
        <div class="row form-group" v-if="captcha">
          <h6>Enter captcha to book the center for: {{ prefferedDate }} {{ prefferedSlot }}</h6>
          <h7>{{ prefferedSlotText }}</h7>
          <div v-html="captcha"></div>
          <input
            name="captha"
            type="text"
            class="form-control-inline"
            placeholder="Enter captcha"
            v-model="captchaText"
          />
          <button @click="schedule()">Schedule</button>
        </div>
      </div>
      <div class="col col-4">
        <div class="message">
          <p class="token">TransactionId: {{ this.transactionId }}</p>
          <p class="token">Token : {{ this.token }}</p>
          <p
            class="message"
            v-for="(message, mIndex) in messages"
            :key="`message_${mIndex}`"
          >
            {{ message }}
          </p>
        </div>
      </div>
    </div>
    <div class="participant row" v-if="participants && participants.length > 0">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ReferenceId</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Id</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, pindex) in participants" :key="`part_${pindex}`">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.gender }}</td>
            <td>{{ p.photoId }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="row" v-if="matches && matches.length > 0">
      <div class="row matching">
        <h5>
          Found {{ matches.length }} centers with vacines and trying to book
        </h5>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>CenterId</th>
              <th>SessionId</th>
              <th>Name</th>
              <th>Address</th>
              <th>Vaccine</th>
              <th>Age</th>
              <th>Capacity</th>
              <!-- <th>
                 Slots
               </th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(match, index) in matches" :key="`matched_${index}`">
              <td>
                <p>{{ match.center_id }}</p>
              </td>
              <td>
                <p>{{ match.session_id }}</p>
              </td>
              <td>
                <p>{{ match.name }}</p>
              </td>
              <td>
                <p>{{ match.address }}</p>
              </td>
              <td>
                <p>{{ match.vaccine }}</p>
              </td>
              <td>
                <p>{{ match.age_limit }}</p>
              </td>
              <td>
                <p>{{ match.capacity }}</p>
              </td>
              <!-- <td><p class="row" v-for="(slot, slotIndex) in match.slots" :key="`slot${slotIndex}`">{{ slot }}</p></td> -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<style>
.row {
  margin-top: 50px;
}

.margin-left-20 {
  margin-left: 20px;
}
</style>
<script lang="ts">
import moment from "moment";
import { Vue, Component, Prop } from "vue-property-decorator";
import { VaccinationService } from "../service/VaccinationService";
import jwt_decode from "jwt-decode";
import { clear } from "console";
import Preferences from './Preferences.vue';

@Component({
  name: 'Vaccination',
  components: { Preferences }
})
export default class Vaccination extends Vue {
  @Prop() name!: string;
  @Prop() initialEnthusiasm!: number;

  otpValue: string = "";
  messages: string[] = [];
  phoneNumber: any = 0;
  phoneSubmitted: boolean = false;
  matches: any[] = [];
  enthusiasm = this.initialEnthusiasm;
  attempt: number = 0;
  timeForTokenToExpire: number = 0;
  currentToken: string = "";
  disableOtp: boolean = false;
  transactionId: string = "";
  token: string = "";
  tokenExp: Date = new Date(0);
  vaccinationService = new VaccinationService();
  timer: any;
  participants: any[] | null = null;
  captcha: string = "";
  captchaText: string = "";
  preferences: any;

  async mounted() {
    this.phoneNumber = sessionStorage.getItem("phoneNumber");
    this.phoneSubmitted = this.phoneNumber ? true : false;

    if (this.tokenExp && this.phoneNumber) {
      await this.generateOtp();
    }
  }

  async generateOtp() {
    const response = await this.vaccinationService.generateOtp(
      this.phoneNumber
    );
    if (response && response.data) {
      this.transactionId = response.data.transactionId;
    } else if (response && response.error) {
      this.displayMessage(response.error);
    }
  }

  get prefferedSlot() {
    const mathingSession = this.matches && this.matches[0];
    if (
      mathingSession &&
      mathingSession.slots &&
      mathingSession.slots.length > 0
    ) {
      return mathingSession.slots[mathingSession.slots.length - 1];
    }

    return "";
  }

  get prefferedDate() {
    const mathingSession = this.matches && this.matches[0];
    if(mathingSession) {
      return mathingSession.date;
    }

    return ''
  }

  get prefferedSlotText() {
    const mathingSession = this.matches && this.matches[0];
    if (
      mathingSession &&
      mathingSession.slots &&
      mathingSession.slots.length > 0
    ) {
      return (
        mathingSession.name +
        " | " +
        mathingSession.address +
        " | " +
        mathingSession.vaccine +
        " | " +
        mathingSession.age_limit +
        " | " +
        mathingSession.capacity
      );
    }

    return "";
  }

  get isTokenExpired() {
    if (this.token) {
      let tokenExpiry: any = jwt_decode(this.token);
      const date = new Date(0);
      date.setUTCSeconds(tokenExpiry.exp);
      if (moment(date).isBefore(moment())) {
        return true;
      }

      return false;
    }

    return true;
  }
  async handleOnComplete() {
    console.log("OTP completed: ", this.otpValue);
    const service = new VaccinationService();
    const tokenResponse = await service.validateOtp(
      this.otpValue,
      this.transactionId
    );
    if (tokenResponse && tokenResponse.data) {
      this.token = tokenResponse.data.token;
      this.displayMessage(`Token fetched: ${this.token}`);
      if (!this.participants) {
        const presponse = await this.vaccinationService.getParticipants(
          this.token
        );
        if (presponse && presponse.data && presponse.data.length > 0) {
          this.participants = presponse.data;
          this.performBooking();
        } else {
          this.displayMessage("Failed to get the list of participants.");
        }
      }
    } else if (tokenResponse && tokenResponse.error) {
      this.displayMessage(tokenResponse.error);
    }
  }

  performBooking() {
    this.timer = setInterval(async () => {
      this.disableOtp = true;
      this.matches = [];
      this.messages = [];
      const service = new VaccinationService();
      this.displayMessage(`Attempt No: ${++this.attempt}`);
      if (this.isTokenExpired) {
        this.displayMessage(
          "token expired. Please enter otp again and press submit to proceed."
        );
        this.otpValue = "";
        this.disableOtp = false;
        this.messages = ["Please enter otp and try again"];
        this.generateOtp();
        clearInterval(this.timer);
      } else {
        const response = await service.getAvailableCenters(this.token,
          (this.participants && this.participants.length) || 0, this.preferences
        );
        if (response && response.data) {
          if (response.data.length === 0) {
            this.displayMessage("No match found. Retrying after one minute.");
          } else {
            this.matches.push(response.data[0]);
            const captchResponse = await this.vaccinationService.getCaptcha(
              this.token
            );
            if (captchResponse && captchResponse.data) {
              this.captcha = captchResponse.data;
              this.$forceUpdate();
            }
            clearInterval(this.timer);
          }
        }

        if (response && response.error) {
          this.displayMessage(response.error);
          this.otpValue = "";
          this.messages = ["Please enter otp and try again"];
          this.disableOtp = false;
        }
      }
    }, 3000);
  }

  async handlePhoneSubmit() {
    if (isNaN(this.phoneNumber) || this.phoneNumber.length !== 10) {
      this.displayMessage("Invalid phone number");
      return;
    }

    sessionStorage.setItem("phoneNumber", this.phoneNumber);

    this.displayMessage("Requesting login. Please enter the obtained otp.");
    await this.generateOtp();
    this.phoneSubmitted = true;
  }

  displayMessage(message: string) {
    this.messages.push(message);
  }

  clear() {
    this.messages = [];
    this.matches = [];
    if (this.timer) {
      clearInterval(this.timer);
    }

    sessionStorage.removeItem("phoneNumber");
    sessionStorage.removeItem('preference');
    sessionStorage.removeItem('states');
    window.location.reload();
  }

  stop() {
    if (this.timer) {
      this.displayMessage("Booking stopped by user");
      clearInterval(this.timer);
      (document as any).getElementById("myAudio").pause();
    }
  }

  resume() {
    if (this.token && !this.isTokenExpired) {
      this.performBooking();
    } else {
      this.displayMessage("Enter otp to continue.");
    }
    (document as any).getElementById("myAudio").pause();
  }

  async schedule() {
    const mathingSession = this.matches && this.matches[0];
    const beneficiaries: string[] =
      (this.participants && this.participants.map((x) => x.id)) || [];
    if (!this.captchaText || beneficiaries.length <= 0 || !mathingSession) {
      this.displayMessage("Insufficient Data. Cannot schedule slot.");
      this.performBooking();
      return;
    }

    if (!this.prefferedSlot) {
      this.displayMessage("Insufficient Data.Not slot available");
      this.performBooking();
      return;
    }

    const scheduleResponse = await this.vaccinationService.scheduleSlot(
      this.token,
      this.captchaText,
      Number(mathingSession.center_id),
      mathingSession.session_id,
      this.prefferedSlot,
      beneficiaries
    );
    if (scheduleResponse && scheduleResponse.data) {
      this.displayMessage(JSON.stringify(scheduleResponse.data));
    }

    if (scheduleResponse && scheduleResponse.error) {
      this.displayMessage(scheduleResponse.error);
    }
    

  }

  handlePreferenceChange(preferences: any) {
    this.preferences = preferences;
  }

}
</script>

<style>
.greeting {
  font-size: 20px;
}
</style>

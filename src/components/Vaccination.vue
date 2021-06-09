<template>
  <div class="container">
    <preferences @preferenceChange="handlePreferenceChange" :errorMessage="errorMessage"></preferences>
    <div class="row">
      <div class="col col-8">
        <div class="row">
          <h1>Schedule me for {{ currentDistrict }}</h1>
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
          <span class="margin-left-20"> Token Valid Till : {{ leftTime }}</span>
          <!-- <div class="captcha" v-html="captcha2"></div>
          <input v-model="captchaText" /> -->
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
    <div v-if="pMatches && pMatches.length > 0">
       <h6 class="alert alert-success">Preferred Centers</h6>
      <matches :matches="pMatches" :captcha="captcha" :token="token" :participants="participants" @startSchedule="handleScheduling" :preferredCenters="preferredCenters" :dose="preferences.dose"></matches>
    </div>
    <div v-if="npMatches && npMatches.length > 0">
       <h6 class="alert alert-danger">Other Centers (Not in preference)</h6>
       <matches :matches="npMatches" :captcha="captcha" :token="token" :participants="participants" @startSchedule="handleScheduling" :preferredCenters="preferredCenters" :dose="preferences.dose"></matches>
    </div>
    <div class="participant row" v-if="participants && participants.length > 0">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ReferenceId</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Id</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, pindex) in participants" :key="`part_${pindex}`">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.gender }}</td>
            <td>{{ p.photoId }}</td>
            <td>{{ getStatusText(p) }}</td>
          </tr>
        </tbody>
      </table>
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
import Preferences from './Preferences.vue';
import Matches from './Matches.vue';

@Component({
  name: 'Vaccination',
  components: { Preferences, Matches }
})
export default class Vaccination extends Vue {
  @Prop() name!: string;
  @Prop() initialEnthusiasm!: number;

  otpValue: string = "";
  messages: string[] = [];
  phoneNumber: any = 0;
  phoneSubmitted: boolean = false;
  matches: any[] = [];
  pMatches: any[] = [];
  npMatches: any[] = [];
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
    captcha2: string = "";
  captchaText: string = "";
  preferences: any;
  timeLeft: number = 0;
  preferredCenters: any[] = [];
  errorMessage: string = '';
  get leftTime() {
    return this.timeLeft;
  }

  set leftTime(value: number) {
    this.timeLeft = value;
  }

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

  isTokenExpired() {
    if (this.token) {
      let tokenExpiry: any = jwt_decode(this.token);
      const expTime = tokenExpiry.exp;
      const currentTime = new Date().getTime()  / 1000;
      this.leftTime = 0;
      
      if(!expTime) {
        return true;
      }

      this.leftTime = expTime - currentTime;
      console.log('time left token: ', this.leftTime);
      this.$forceUpdate();
      if (!expTime || expTime <= currentTime ) {
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

        const captchaResponse = await this.vaccinationService.getCaptcha(this.token);
        if(captchaResponse && captchaResponse.data) {
          this.captcha2 = captchaResponse.data;
        }
      }
    } else if (tokenResponse && tokenResponse.error) {
      this.displayMessage(tokenResponse.error);
    }
  }

  performBooking(interval:number = 10000) {
    document.body.style.backgroundColor = "white";
    if(this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(async () => {
      this.disableOtp = true;
      this.matches = [];
      this.pMatches = [];
      this.npMatches = [];
    
      this.messages = [];
      this.captcha = '';
      const service = new VaccinationService();
      this.displayMessage(`Attempt No: ${++this.attempt}`);
      if (this.isTokenExpired()) {
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
            this.matches = response.data;

            if(this.currentVaccine) {
              // Show only the preffered matches
              this.matches = this.matches.filter(x=> x.vaccine === this.currentVaccine);
            }

            if(this.preferredCenters && this.preferredCenters.length) {
              this.pMatches = this.matches.filter(x=> this.preferredCenters.some(y => y.id === x.center_id));
              if(this.captchaText) {
                if(this.timer) {
                  clearInterval(this.timer);
                }
                this.handleScheduling(this.pMatches, this.captchaText);
              }
              this.npMatches = this.matches.filter(x=> this.preferredCenters.some(y => y.id !== x.center_id)).slice(0, 5);
            } else {
              this.pMatches = this.matches;
              this.npMatches = [];
            }

      
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
    }, interval);
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
      this.pMatches = [];
      this.npMatches = [];
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

  resume(interval: number = 10000) {
    if (this.token && !this.isTokenExpired()) {
      this.performBooking(interval);
    } else {
      this.otpValue = "";
      this.disableOtp = false;
      this.messages = ["Please enter otp and try again"];
      this.vaccinationService.generateOtp(this.phoneNumber);
      this.displayMessage("Enter otp to continue.");
    }
    (document as any).getElementById("myAudio").pause();
  }

  async handleScheduling(match:any, captchaText: string) {
    this.captchaText = captchaText;
    await this.schedule(match);
  }

  async schedule(mathingSession: any, refresh = true) {
    const beneficiaries: string[] =
      (this.participants && this.participants.map((x) => x.id)) || [];
    if (!this.captchaText || beneficiaries.length <= 0 || !mathingSession) {
      this.errorMessage = "Insufficient Data. Cannot schedule slot.";
      this.displayMessage(this.errorMessage);
      if(refresh) {
        this.resume(3000);
      }
      return;
    }

    if (!this.prefferedSlot) {
       this.errorMessage = "Insufficient Data.Not slot available";
      this.displayMessage(this.errorMessage);
      if(refresh) {
        this.resume(3000);
      }
      return;
    }

    const scheduleResponse = await this.vaccinationService.scheduleSlot(
      this.token,
      this.captchaText,
      Number(mathingSession.center_id),
      mathingSession.session_id,
      this.prefferedSlot,
      beneficiaries,
      this.preferences.dose
    );
    if (scheduleResponse && scheduleResponse.data) {
      this.displayMessage(JSON.stringify(scheduleResponse.data));
      this.matches = [];
      this.pMatches = [];
      this.npMatches = [];
      this.captcha = '';
      this.captchaText = '';
      
      window.alert(`Booked successfully. ${JSON.stringify(scheduleResponse.data)}`);
    }

    if (scheduleResponse && scheduleResponse.error) {
      this.errorMessage = `${scheduleResponse.error}`;
      this.displayMessage(scheduleResponse.error);
      if(refresh) {
        this.resume(3000);
      }
    }
    

  }

  handlePreferenceChange(preferences: any) {
    this.preferences = preferences;
    this.currentDistrict = this.preferences.district.district_name;
    this.preferredCenters = this.preferences.centers;
  }

  cDistrict = 'Pune';
  get currentDistrict() {
    return this.cDistrict;
  }

  set currentDistrict(name: string) {
    this.cDistrict = name;
  }

  get currentVaccine() {
    if(this.participants && this.participants.length > 0 && this.preferences.dose === 2) {
      return this.participants[0].vaccine;
    }

    return '';
  }

  getStatusText(participant:any) {
    if(participant && participant.status) {
       if(participant.vaccine) {
         return `${participant.status} with ${participant.vaccine}`;
       }

       return participant.status;
    }

    return '';
  }
}
</script>

<style>
.greeting {
  font-size: 20px;
}
</style>

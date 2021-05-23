<template>
<div class="matches" v-if="matches && matches.length > 0">
    <table class="table table-striped">
        <thead>
            <tr>
                <th>
                    Schedule
                </th>
                 <th>
                    Name
                </th>
                <th>
                    Vaccine
                </th>
                <th>
                    Available (Dose {{ dose }})
                </th>
                <th>
                    Address
                </th>
                <th>
                    When
                </th>
                <th>
                    Center Id
                </th>
            </tr>
        </thead>
        <tbody>
              <tr v-for="(match, index) in matches" :key="`matches_${index}`">
                <td>
                    <div class="row">
                        <div v-html="captcha"></div>
                        <input v-model="captchaText" @change="handleFocusChange"  @keypress.enter="schedule(match)" :id="`capthca-input${index}`" />
                        <button class="btn btn-primary" @click="schedule(match)">Book</button>
                    </div>
                </td>
                  <td>{{match.name}}</td>
                  <td>{{match.vaccine}}</td>
                   <td>{{match.capacity }}</td>
                  <td>{{match.address}}</td>
             
                <td>{{match.date}} {{ getSlot(match) }} </td>     
                   <td>{{match.center_id}}</td>
            </tr>
        </tbody>
    </table>
</div>
</template>
<style>
 .table {
     width: 120%;
 }
 td {
         text-align: center;
     }
</style>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class Matches extends Vue {
    @Prop({default : () => []}) matches!: any[];
    @Prop({default : () => []}) preferredCenters!: any[];
    @Prop({default : () => []}) participants!: string[];
    @Prop({ default : ''}) token!: string; 
    @Prop({default: ''}) captcha!:string;
    @Prop({default: 1}) dose!: number;

   
    captchaText = '';
   
  getSlot(mathingSession:any) {
    if (
      mathingSession &&
      mathingSession.slots &&
      mathingSession.slots.length > 0
    ) {
      return mathingSession.slots[mathingSession.slots.length - 1];
    }

    return "";
  }


    async schedule(match:any) {
       this.$emit('startSchedule', match, this.captchaText);
       this.captchaText = '';
    }

    handleFocusChange() {
        if(this.captchaText) {  
            (document as any).getElementById("myAudio").pause();
        }
    }

    // mounted() {
    //     const input = document.getElementById('capthca-input0');
    //     if(input) {
    //         input.focus();
    //     }
    // }

    // updated() {
    //     const input = document.getElementById('capthca-input0');
    //     if(input) {
    //         input.focus();
    //     }
    // }
}
</script>
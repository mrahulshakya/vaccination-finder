import Vue from "vue";
import VaccinationComponent from "./components/Vaccination.vue";


let v = new Vue({
    el: "#app",
    template: `
    <div>
        <vaccination-component></vaccination-component> 
    </div>
    `,
    data: { name: "World" },
    components: {
        VaccinationComponent
    }
});

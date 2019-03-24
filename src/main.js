import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import Vuex from 'vuex';
import 'file-drop-element';

Vue.config.productionTip = false;

Vue.use(Vuex);

new Vue({
    render: h => h(App),
}).$mount('#app');

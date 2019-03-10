import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import 'file-drop-element';

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');

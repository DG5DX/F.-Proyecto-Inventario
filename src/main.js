import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router';
import { Quasar, Notify, Loading } from 'quasar'

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass'


const app = createApp(App);

app.use(router);
app.use(Quasar, {
    plugins: {
        Notify,
        Loading,
    },
});

app.mount('#app')

<template>
    <v-snackbar v-model="show" :color="type" :timeout="4000" multi-line>
        {{ text }}
        <v-btn dark flat @click="show = false">Close</v-btn>
    </v-snackbar>
</template>

<script>
    import {eventBus} from "../services/events-manager";

    export default {
        data: () => ({
            show: false,
            text: '',
            type: 'info'
        }),

        mounted() {
            eventBus.$on('showSnackbar', (text, type) => {
                this.type = type;
                this.text = text;
                this.show = true;
            });
        }
    }
</script>

<style lang="scss">

</style>

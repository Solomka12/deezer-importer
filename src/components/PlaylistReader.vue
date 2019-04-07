<template>
    <v-container>
        <v-layout text-xs-center wrap>
            <v-flex>
                <file-drop ref="fileDrop">
                    <v-btn flat color="primary" @click="pickFile">Choose file</v-btn>
                    <div>or drop it here</div>
                    <input
                            type="file"
                            style="display: none"
                            ref="uploader"
                            accept="*"
                            @change="onFilePicked">
                </file-drop>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
    import PLParser from 'playlist-parser';

    export default {
        mounted() {
            const dropTarget = this.$refs.fileDrop;
            dropTarget.addEventListener('filedrop', (e) => {
                this.parsePlaylist(e._files[0]);
            });
        },
        methods: {
            onFilePicked(e) {
                this.parsePlaylist(e.target.files[0]);
            },
            pickFile() {
                this.$refs.uploader.click()
            },
            parsePlaylist(data) {
                console.log(data);
                const reader = new FileReader();

                reader.onload = (e) => {
                    let playlist;
                    // TODO (31.03.2019): Add more playlists format support and make data validation
                    if (data.type.split('/')[1] === 'json') {
                        playlist = JSON.parse(e.target.result);
                    } else {
                        playlist = PLParser.M3U.parse(e.target.result, { encoding: "utf8" });
                    }

                    this.$store.commit('setPlaylist', playlist);
                    this.$store.commit('setPlStatus', 'new');
                };
                reader.readAsText(data);
            }
        }
    }
</script>

<style scoped>
    file-drop {
        width: 30%;
        height: 120px;
        border: 1px dashed #666;
        border-radius: 10px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    file-drop.drop-valid {
        background-color: rgba(0, 128, 0, 0.4);
    }

    file-drop.drop-invalid {
        background-color: rgba(255, 0, 0, 0.4);
    }
</style>

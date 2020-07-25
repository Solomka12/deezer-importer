const DZ = window.DZ;

export function getfirstFoundDeezerTrack(trackData) {
    return new Promise(async (resolve, reject) => {
        let allowed = false;
        let track = null;

        // Due to the limit of api requests (50 per 5 seconds)
        setTimeout(() => {
            if (track !== null) resolve(track);
            else allowed = true;
        }, 100);

        try {
            const [firstTrack] = await findDeezerTracksByArtistAndTitle(trackData);
            if (allowed) resolve(firstTrack);
            else track = firstTrack;
        } catch (e) {
            reject(e);
        }
    });
}

export function findDeezerTracks(query = '', fuzzyMode = false) {
    return new Promise((resolve, reject) => {
        const urlSearchParams = new URLSearchParams(`q=${query}`);

        if (fuzzyMode) urlSearchParams.append('strict', 'on');

        DZ.api(`/search?${urlSearchParams}`, resp => {
            if (resp.error) reject(resp.error);
            else resolve(resp.data.filter(item => item.type === 'track'));
        });
    });
}

export function findDeezerTracksByArtistAndTitle({artist, title}, fuzzyMode) {
    return findDeezerTracks(`artist:"${artist}" track:"${title}"`, fuzzyMode)
}

export function exportPlaylistToDeezer(playlists) {
    const promises = playlists.map(pl => {
        return new Promise((resolve, reject) => {
            DZ.api('user/me/playlists', 'POST', {title: pl.name}, (response) => {
                if (response.error) reject(response);
                else {
                    console.log("New playlist ID", response.id);
                    DZ.api(`playlist/${response.id}/tracks`, 'POST', {songs: pl.songs}, (response) => {
                        if (response.error) reject(response);
                        else {
                            console.log("Songs were added", pl);
                            resolve(response);
                        }
                    });
                }
            });
        })
    });

    return Promise.all(promises);
}

export default {
    getfirstFoundDeezerTrack,
    findDeezerTracks,
    findDeezerTracksByArtistAndTitle,
    exportPlaylistToDeezer
}
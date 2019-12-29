const DZ = window.DZ;

export function getDeezerTrack({artist, title}) {
    return new Promise((resolve) => {
        let allowed = false;
        let track = null;

        setTimeout(() => {
            console.log(allowed, track);
            if (track !== null) resolve(track);
            else allowed = true;
        }, 100);

        DZ.api(`/search?q=artist:"${artist}" track:"${title}"`, function (response) {
            console.log(response);
            const fetchedTrack = response.data.find(item => item.type === 'track');
            if (allowed) resolve(fetchedTrack);
            else track = fetchedTrack;
        });
    });
}

export function findDeezerTracks({artist, title}) {
    return new Promise((resolve) => {
        DZ.api(`/search?q=artist:"${artist}" track:"${title}"`, function (response) {
            resolve(response.data.filter(item => item.type === 'track'));
        });
    });
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
    getDeezerTrack,
    findDeezerTracks,
    exportPlaylistToDeezer
}
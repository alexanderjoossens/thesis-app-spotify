import {afterDBcheck, getData, renderuser1ready, rendervisual} from "./server.js"
import {insertRecSongDataToDB, db, globalVector2state, globalVector1, globalVector2, currentUser, currentCode, currentVector} from './database_functionality.js'

let recTrackTitlesA = []
let recTrackTitlesB = []
let tracksA = []
let tracksB = []
let artistsA = []
let artistsB = []
let mutualTracks = []
let mutualArtists = []
let mutualGenres = []
let mutualRecTracks = []
let codeHere = ''
let finalTrackIdList = []
let nb_final_songs = 20
let tracksWithSameArtist = []

export async function getCombinedRecTracks(code) {
    console.log('in GetCombinedRecTracks with code: ', code);
    getMutualTracks(code)
    getMutualArtistSongs(code)
    // getMutualGenres(code)
    getMutualRecTracks(code)
    setTimeout(getCombinedRecTracks2, 5000)
}

function getCombinedRecTracks2() {
    console.log('mutualTracks', mutualTracks)
    console.log('mutualArtists', mutualArtists)
    console.log('tracksWithSameArtist: ', tracksWithSameArtist)
    console.log('mutualGenres', mutualGenres)
    console.log('mutualRecTracks', mutualRecTracks)
    if (mutualTracks.length > nb_final_songs) {
        finalTrackIdList = mutualTracks.slice(0,nb_final_songs)
    }

    if (tracksWithSameArtist.length + mutualTracks.length > nb_final_songs) {
        finalTrackIdList = mutualTracks.slice(0, nb_final_songs)
        while (finalTrackIdList.length <= 20) {
            finalTrackIdList.push(tracksWithSameArtist[0])
            tracksWithSameArtist = tracksWithSameArtist.slice(1, 999)
        }
    }
    console.log('finalTrackIdList: ', finalTrackIdList)
}

function getMutualTracks(code) {
    tracksA = getTracks('a',code)
    tracksB = getTracks('b',code)
    codeHere = code
    setTimeout(getMutualTracks2,1000)
}

function getMutualTracks2() {
    // console.log('tracksA: ',tracksA)
    // console.log('tracksB: ',tracksB)
    mutualTracks = tracksA.filter(value => tracksB.includes(value));
    // console.log('returning mutualTracks: ', mutualTracks)
}

function getMutualArtistSongs(code) {
    getMutualArtists(code)
    setTimeout(getMutualArtistSongs2,1000)
}

async function getMutualArtistSongs2() {
    // remove duplicates
    mutualArtists = mutualArtists.filter((element, index) => {
        return mutualArtists.indexOf(element) === index;
    });

    for (var trackA of tracksA) {
        trackA = trackA.replaceAll('"','');
        let current_track = await getData("/tracks/"+trackA)
        if (mutualArtists.includes(current_track.artists[0].id)) {
            tracksWithSameArtist.push(trackA)
        }
    }
    for (var trackB of tracksB) {
        trackB = trackB.replaceAll('"','');
        let current_track = await getData("/tracks/"+trackB)
        if (mutualArtists.includes(current_track.artists[0].id)) {
            tracksWithSameArtist.push(trackB)
        }
    }
}

function getMutualArtists(code) {
    getArtists('a',code)
    getArtists('b',code)
    codeHere = code
    // console.log('waiting 1sec... can be made shorter??')
    setTimeout(getMutualArtists2,1000)
}

function getMutualArtists2() {
    // console.log('artistsA: ',artistsA)
    // console.log('artistsB: ',artistsB)
    mutualArtists = artistsA.filter(value => artistsB.includes(value));
    // console.log('returning mutualArtists: ', mutualArtists)
}

function getMutualGenres(code) {
    return null
}

function getMutualRecTracks(code) {
    recTrackTitlesA = getRecTrackTitles('a',code)
    recTrackTitlesB = getRecTrackTitles('b',code)
    codeHere = code
    setTimeout(getMutualRecTracks2,1000)
}

function getMutualRecTracks2() {
    // console.log('recTrackTitlesA: ',recTrackTitlesA)
    // console.log('recTrackTitlesB: ',recTrackTitlesB)
    mutualRecTracks = recTrackTitlesA.filter(value => recTrackTitlesB.includes(value));
}

function getTracks(user, code) {
    let sqlTra = ""
    let tracksToReturn = []
    if (user == 'a') {
        sqlTra = "SELECT tracksA FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    else {
        sqlTra = "SELECT tracksB FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    let query = db.query(sqlTra,(err,retreivedTrackData)=>{
        if (err) throw err;
        // console.log('retrData: ', retreivedTrackData)
        tracksToReturn = retreivedTrackData.toString().split(',')
        // console.log('tracksToReturn: ', tracksToReturn)

        if (user == 'a') {
            // console.log('retrData: ', retreivedTrackData[0].tracksA)
            // console.log('retrData.split: ', retreivedTrackData[0].tracksA.split(','))
            tracksA = retreivedTrackData[0].tracksA.split(',')
        }
        else {
            // console.log('retrData: ', retreivedTrackData[0].tracksB)
            // console.log('retrData.split: ', retreivedTrackData[0].tracksB.split(','))
            tracksB = retreivedTrackData[0].tracksB.split(',')
        }
    });
    return tracksToReturn
}

function getArtists(user, code) {
    console.log('getting artists from user ',user,'...')
    let sqlArt = ""
    if (user == 'a') {
        sqlArt = "SELECT artistsA FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    else {
        sqlArt = "SELECT artistsB FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    // console.log('sqlArt: ',sqlArt)
    let query = db.query(sqlArt,(err,retreivedArtistsData)=>{
        if (err) throw err;
        if (user == 'a') {
            // console.log('retrData: ', retreivedArtistsData[0].artistsA)
            // console.log('retrData.split: ', retreivedArtistsData[0].artistsA.split(','))
            artistsA = retreivedArtistsData[0].artistsA.split(',')
        }
        else {
            // console.log('retrData: ', retreivedArtistsData[0].artistsB)
            // console.log('retrData.split: ', retreivedArtistsData[0].artistsB.split(','))
            artistsB = retreivedArtistsData[0].artistsB.split(',')
        }
    });
}

function getRecTrackTitles(user, code) {
    let sql3 = ""
    if (user == 'a') {
        sql3 = "SELECT recTracksA FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    else {
        sql3 = "SELECT recTracksB FROM spotify_table4 WHERE code = '"+code.toString()+"'";
    }
    let regex = /\\/g;
    let recoSongTitles = []
    let query = db.query(sql3,(err,retreivedData)=>{
        if (err) throw err;
        // console.log('sql3: ',sql3)
        // console.log('retreivedData: ', retreivedData)
        // console.log('retreivedData type: ', typeof retreivedData)
        // console.log('retreivedData[0].recTracksA: ',retreivedData[0].recTracksA);
        // console.log('JSON.parse(retreivedData[0].recTracksA).replace(/\\/g, ""): ',JSON.parse(retreivedData[0].recTracksA.replace(/\\/g, "")));
        // console.log('type: ',typeof retreivedData[0].recTracksA)
        //let recoTracksA = JSON.parse(retreivedData[0].recTracksA.replace(/\\/g, ""));
        let recoTracks = null
        if (user == 'a') {
            recoTracks = JSON.parse(retreivedData[0].recTracksA);
        }
        else {
            recoTracks = JSON.parse(retreivedData[0].recTracksB);
        }
        // console.log('recoTracks: ',recoTracks)
        let recoTracksLength = Object.keys(recoTracks).length;
        // console.log('recoTracks.length: ',recoTracksLength);
        for (let i=0;i<recoTracksLength;i++) {
            // console.log('recoTracksA[i.toString()]: ', recoTracksA[i.toString()])
            // console.log('JSON.parse(recoTracksA[i.toString()]): ', JSON.parse(recoTracksA[i.toString()]))
            // console.log('JSON.parse(recoTracks[i.toString()])["name"] ', JSON.parse(recoTracks[i.toString()])["name"])
            recoSongTitles.push(JSON.parse(recoTracks[i.toString()])["name"])
        }
        // console.log('all recommended song titles: ',recoSongTitles)
    });
    return recoSongTitles
    // input: code
    // output: final tracks to recommend

    // first, get list of recSongsA and recSongsB from DB
    // then, compare the lists of songs from A and B
        // if there are more than 10 mutual songs, add these to final recommendations
        // if less than 10:
            // compare the lists of artists from A and B
            // if there are mutual artists: add these songs to final recommendations
}
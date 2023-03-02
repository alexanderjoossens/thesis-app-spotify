import express, { response } from "express"; // a node.js web application framework
import fetch from "node-fetch";
import { generate_vector_from_tracks, globalGeneratedVector } from "./vector.js";
//import {db_function} from "./own_database.js"
import { getCombinedRecTracks } from "./recommendation.js";
import {insertRecSongDataToDB, db, globalVector2state, globalVector1, globalVector2, currentUser, currentCode, currentVector} from './database_functionality.js'
import * as db_func from "./database_functionality.js"
// import * from "./database_functionality.js";

// global Variables
const redirect_uri = "http://localhost:3000/callback";
const client_id = "3e1c8f186968494ba2a1891f461566cb";
const client_secret = "5a235e5dddb94a37b0a396e0fa395df8";
var playlists = []
var selected_playlists = [];
var recommended_tracks = [];
var recommended_tracks_names = [];
var recommended_tracks_artists = [];
var recommended_tracks_urls = [];
var playlist_names = [];
var selected_track_ids = []
var selected_artist_ids = []
var selected_genres = []
let temp_req = undefined
let temp_ress = undefined
let temp_res2 = undefined
let temporaryPlaylistSelection = 'dummyValue'

//const router = express.Router();
const app = express();
// const path = import('path');
// app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.static("public")); // needed for style.css to work
// app.use(express.json)
app.use(express.urlencoded({extended: true}))
app.set("views", "./views");
app.set("view engine", "pug"); // use pug to generate html pages
global.access_token;

app.get("/createvectorstable", (req,res)=>{
  let sql = "CREATE TABLE spotify_table4(id int AUTO_INCREMENT, code VARCHAR(225),vector1 VARCHAR(225),vector2 VARCHAR(225),PRIMARY KEY(id), sel_pl1 VARCHAR(1000), sel_pl2 VARCHAR(1000), recTracksA LONGTEXT, recTracksB LONGTEXT, tracksA LONGTEXT, tracksB LONGTEXT, artistsA LONGTEXT, artistsB LONGTEXT)";
  db.query(sql,(err,result)=>{
    if (err) throw err;
  console.log(result);
  res.send("vectors table created")
  })
});

//Insert (new) vector
let givenCodet = "t1"
let vector1 = "1-1.1-1.11";
let todo = true;

app.get("/addVector", (req, res)=>{
  let vectorToPutt = vector1;
  let DB = app.get("/getDB");
  console.log("DB: ",DB);
  for (let i=0; i<DB.length; i++) {
    // check if code is already present in DB
    console.log('DB[0]: ', DB[0])
  }
  if (todo) {
    // code was not present in DB. let's make a new entry
    let vectorToPut = {code: givenCodet, vector1: vectorToPutt, vector2: "empty"};
    let sql = "INSERT INTO vectors SET ?"
    let query = db.query(sql,vectorToPut,(err,result)=>{
      if (err) throw err;
      console.log("result");
      todo = false;
      res.send("Vector inserted");
    });
  }
});

// render '/' page (index page)
app.get("/", function (req, res) {
  res.render("index");
});

// just for quickly testing visuals. can be deleted afterwards
app.get('/visual1test', function (req, res) {
  res.render("visual1", {vector1:globalVector1,vector2:globalVector2,playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: {
    tracks: [
      {
        album: [Object],
        artists: [Array],
        available_markets: [Array],
        disc_number: 1,
        duration_ms: 153406,
        explicit: true,
        external_ids: [Object],
        external_urls: [Object],
        href: 'https://api.spotify.com/v1/tracks/22ruOqBqBRiZDiXFud4OXa',
        id: '22ruOqBqBRiZDiXFud4OXa',
        is_local: false,
        name: 'Over The Top (feat. Drake)',
        popularity: 67,
        preview_url: 'https://p.scdn.co/mp3-preview/fe8684f8bba6ed431d672960cf2b2e260361c52a?cid=3e1c8f186968494ba2a1891f461566cb',
        track_number: 6,
        type: 'track',
        uri: 'spotify:track:22ruOqBqBRiZDiXFud4OXa'
      }]
    }.tracks}
)});
app.get('/visual2test', function (req, res) {
  res.render("visual2", {vector1:globalVector1,vector2:globalVector2,playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: {
    tracks: [
      {
        album: [Object],
        artists: [Array],
        available_markets: [Array],
        disc_number: 1,
        duration_ms: 153406,
        explicit: true,
        external_ids: [Object],
        external_urls: [Object],
        href: 'https://api.spotify.com/v1/tracks/22ruOqBqBRiZDiXFud4OXa',
        id: '22ruOqBqBRiZDiXFud4OXa',
        is_local: false,
        name: 'Over The Top (feat. Drake)',
        popularity: 67,
        preview_url: 'https://p.scdn.co/mp3-preview/fe8684f8bba6ed431d672960cf2b2e260361c52a?cid=3e1c8f186968494ba2a1891f461566cb',
        track_number: 6,
        type: 'track',
        uri: 'spotify:track:22ruOqBqBRiZDiXFud4OXa'
      }]
    }.tracks}
)});


app.get("/info", function (req, res) {
  res.render("info");
});

// load Spotify authorization/login page and redirect to Spotify
app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-library-read",
    redirect_uri: redirect_uri,
  });
  console.log("authorization clicked")

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});


// Spotify redirects back to '/callback'. Here we save the authorization code and redirect to the dashbord
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  });

  const data = await response.json();
  global.access_token = data.access_token;

  console.log('modifying globalVector2state to empty...')
  db_func.modifyCurrentVector2State('empty')
  console.log('modifying temporaryPlaylistSelection to dummyvalue...')
  temporaryPlaylistSelection = 'dummyvalue'
  res.redirect("/playlistselection");
  // res.redirect("/recommendations")
});

// render '/playlistselection' page
app.get("/playlistselection", async (req, res) => {
  
  // GET request: /me
  const userInfo = await getData("/me");
  const username = userInfo.display_name;
  const first_name = username.split(" ")[0]
  const tracks = await getData("/me/tracks?limit=10");
  playlists = await getData("/me/playlists?limit=15");

  res.render("playlistselection", {first_name:first_name, user: userInfo, tracks: tracks.items, playlists: playlists.items });
});

// render '/recommendations' page (when some playlists are selected)
app.get("/recommendations", async (req, res) => {
  console.log('in app.get(/recommendations)')
  console.log('selected playlists now: ',selected_playlists)
  // const artist_id = req.query.artist;
  // const track_id = req.query.track;
  const artist_id = "3TVXtAsR1Inumwj472S9r4"
  const track_id = "3F5CgOj3wFlRv51JsHbxhe"

  const params = new URLSearchParams({
    seed_artist: artist_id,
    seed_genres: "hip-hop",
    seed_tracks: track_id,
  });

  const data1 = await getData("/recommendations?" + params);
  console.log('data1: ',data1)
  res.render("recommendations", { rec_tracks: data1.tracks , playlists: ['c1r7YlhStD1shjJxQyVIwmt','2e7IuH9wImdX4ulWvzi4q'], playlist_names: ['eerste geselecteerde playlist', 'tweede geselecte playlist']});
});

// render '/playlist' page
app.get("/playlist", async (req, res) => {
  const playlist_id = req.query.playlist_id;
  console.log('playlist id',playlist_id)
  const playlist_name = req.query.playlist_name
  const params = new URLSearchParams({
    playlist_id: playlist_id,
  });

  // GET request: /playlists/{playlistID}/tracks
  const data2 = await getData("/playlists/"+playlist_id+'/tracks'); //todo limit erachter EN bug als playlist leeg is
  res.render("playlist", { tracks: data2.items, name: playlist_name });
});


app.post('/', async(req,res) => {
  res.redirect("/info")
})

app.post('/info', async(req,res) => {
  res.redirect("/authorize")
})

app.post('/playlistselection', async (req, res) => {
  console.log('\n\n-----post playlistselection-----')
  temporaryPlaylistSelection = Object.keys(req.body)
  console.log('temporaryPlaylistSelection: ',temporaryPlaylistSelection)
  console.log('making user vectors...')
  temp_res2 = res
  makeUserVector(req.body) // req.body = selected_playlists
  //res.render("code", {playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: recommended_tracks})
});

export function rendercodepage(){
  db_func.modifyCurrentVector(globalGeneratedVector)
  console.log('rendering code page...')
  temp_res2.render("code", {playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: recommended_tracks})
}

app.post('/code', async(req, ress) => {
  console.log('\n\n-----post codepage-----')
  db_func.modifyCurrentVector(globalGeneratedVector)
  db_func.modifyCurrentCode(req.body.code);
  temp_req = req;
  temp_ress = ress;
  console.log('check if code is already in DB...')
  db_func.isCodeInDB(req.body.code);
  //after this (1sec) code will continue in afterDBcheck()
});


export function afterDBcheck() {

  console.log('DB check done. vector2state=',globalVector2state)
  let req = temp_req;
  let ress = temp_ress;
  // res = full OR halffull OR empty
  if (globalVector2state[0] == 'f') {
    // TODO: hier toch direct naar die visualisatie sturen
    ress.send('This code has already been used twice.')
    return
  }
  else if (globalVector2state[0] == 'h') {
    let id = globalVector2state.slice(8)
    console.log('adding vector 2...')
    let added = db_func.insertVector2andRecSongDataB(req.body.code, currentVector, id, recommended_tracks,recommended_tracks_urls,recommended_tracks_names,recommended_tracks_artists, selected_track_ids, selected_artist_ids)
    console.log('vector2 was added!', added)
        //after this insertion there is a timeout (necessary), after which rendervisual will be rendered
  }
  else if (globalVector2state[0] == 'e') {
    console.log('adding new entry with code and vector 1...')
    let added = db_func.insertVector1andRecSongDataA(req.body.code, currentVector,recommended_tracks,recommended_tracks_urls,recommended_tracks_names,recommended_tracks_artists)
    db_func.addSelectedTrackIdsToDB('a',req.body.code, selected_track_ids)
    db_func.addSelectedArtistIdsToDB('a',req.body.code, selected_artist_ids)
    db_func.addPlaylistSelectionToDB(req.body.code, temporaryPlaylistSelection)
    //after this insertion there is a timeout (necessary), after which user1ready will be rendered
    console.log("vector1 was added!", added)
  }
}

export async function rendervisual() {

  console.log('adding playlist selection to DB...')
  // add playlists of user 2 to database
  db_func.addPlaylistSelectionToDB(currentCode, temporaryPlaylistSelection)

  let final_rec_tracks = getCombinedRecTracks(currentCode)

  if(currentCode[0] == 'a') {

    temp_ress.render("visual1", {vector1:globalVector1,vector2:globalVector2,playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: recommended_tracks, dummy_rec_songs: {
      tracks: [
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 153406,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/22ruOqBqBRiZDiXFud4OXa',
          id: '22ruOqBqBRiZDiXFud4OXa',
          is_local: false,
          name: 'Over The Top (feat. Drake)',
          popularity: 67,
          preview_url: 'https://p.scdn.co/mp3-preview/fe8684f8bba6ed431d672960cf2b2e260361c52a?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 6,
          type: 'track',
          uri: 'spotify:track:22ruOqBqBRiZDiXFud4OXa'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 152961,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/0wshkEEcJUQU33RSRBb5dv',
          id: '0wshkEEcJUQU33RSRBb5dv',
          is_local: false,
          name: 'BackOutsideBoyz',
          popularity: 74,
          preview_url: null,
          track_number: 4,
          type: 'track',
          uri: 'spotify:track:0wshkEEcJUQU33RSRBb5dv'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 185026,
          explicit: false,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/7Gt3D77ApMQ8m4r3GTw1g5',
          id: '7Gt3D77ApMQ8m4r3GTw1g5',
          is_local: false,
          name: 'Faith - Part 2',
          popularity: 34,
          preview_url: 'https://p.scdn.co/mp3-preview/826b7108bf22877836a0593d2f2b76e891363d4d?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 16,
          type: 'track',
          uri: 'spotify:track:7Gt3D77ApMQ8m4r3GTw1g5'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 126960,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/1j6kDJttn6wbVyMaM42Nxm',
          id: '1j6kDJttn6wbVyMaM42Nxm',
          is_local: false,
          name: 'Lord Pretty Flacko Jodye 2 (LPFJ2)',
          popularity: 68,
          preview_url: 'https://p.scdn.co/mp3-preview/771a3ad9f0c3819f2f138d97fe66413468a18ebf?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 7,
          type: 'track',
          uri: 'spotify:track:1j6kDJttn6wbVyMaM42Nxm'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [],
          disc_number: 1,
          duration_ms: 305840,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/3FFcZZq3Z3EJrhUecwcMdG',
          id: '3FFcZZq3Z3EJrhUecwcMdG',
          is_local: false,
          name: 'She Will',
          popularity: 0,
          preview_url: null,
          track_number: 6,
          type: 'track',
          uri: 'spotify:track:3FFcZZq3Z3EJrhUecwcMdG'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 167915,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/527k23H0A4Q0UJN3vGs0Da',
          id: '527k23H0A4Q0UJN3vGs0Da',
          is_local: false,
          name: 'After Party',
          popularity: 74,
          preview_url: 'https://p.scdn.co/mp3-preview/a379a92d578aec215354e47c3bf6b38a3f0e908d?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 4,
          type: 'track',
          uri: 'spotify:track:527k23H0A4Q0UJN3vGs0Da'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 254369,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/1B87ZDrD3Pno9hS4stamWO',
          id: '1B87ZDrD3Pno9hS4stamWO',
          is_local: false,
          name: 'Comin Out Strong (feat. The Weeknd)',
          popularity: 61,
          preview_url: 'https://p.scdn.co/mp3-preview/f78729bfa330119cd79776cd23ebac6177a5c269?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 2,
          type: 'track',
          uri: 'spotify:track:1B87ZDrD3Pno9hS4stamWO'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 153626,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/0IJA9KP6rT55jrP1YpTdhx',
          id: '0IJA9KP6rT55jrP1YpTdhx',
          is_local: false,
          name: 'Out Of Love (feat. Internet Money)',
          popularity: 68,
          preview_url: null,
          track_number: 19,
          type: 'track',
          uri: 'spotify:track:0IJA9KP6rT55jrP1YpTdhx'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 192995,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/5Eg6N02CTSSbdthjVc7wLA',
          id: '5Eg6N02CTSSbdthjVc7wLA',
          is_local: false,
          name: "Don't Hurt Me",
          popularity: 49,
          preview_url: null,
          track_number: 1,
          type: 'track',
          uri: 'spotify:track:5Eg6N02CTSSbdthjVc7wLA'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [],
          disc_number: 1,
          duration_ms: 232533,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/3MQLYKlNxsk7csGVEcw0R6',
          id: '3MQLYKlNxsk7csGVEcw0R6',
          is_local: false,
          name: 'Hello - Feat. Dr. Dre And MC Ren',
          popularity: 0,
          preview_url: null,
          track_number: 1,
          type: 'track',
          uri: 'spotify:track:3MQLYKlNxsk7csGVEcw0R6'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 212640,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/2rzBvHM9h36Tpdj7Jdajka',
          id: '2rzBvHM9h36Tpdj7Jdajka',
          is_local: false,
          name: 'Wild for the Night (feat. Skrillex & Birdy Nam Nam)',
          popularity: 63,
          preview_url: 'https://p.scdn.co/mp3-preview/f8790916b53b5b6dc9e8f8c49ad7d8f9545798d5?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 8,
          type: 'track',
          uri: 'spotify:track:2rzBvHM9h36Tpdj7Jdajka'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 260519,
          explicit: false,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/5hTl2uxJGd1sbLtovguuuk',
          id: '5hTl2uxJGd1sbLtovguuuk',
          is_local: false,
          name: 'Stars Align (with Drake)',
          popularity: 62,
          preview_url: 'https://p.scdn.co/mp3-preview/1a89198036f70f1040cc60189c4f63fca7cb1c48?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 3,
          type: 'track',
          uri: 'spotify:track:5hTl2uxJGd1sbLtovguuuk'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 300640,
          explicit: false,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/0gFB5H3pHN13ERt2FyMuWi',
          id: '0gFB5H3pHN13ERt2FyMuWi',
          is_local: false,
          name: 'It Takes Two',
          popularity: 55,
          preview_url: 'https://p.scdn.co/mp3-preview/567b9878632d033a8113b0eacebcc4de58c87e18?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 1,
          type: 'track',
          uri: 'spotify:track:0gFB5H3pHN13ERt2FyMuWi'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 247600,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/0YSTRuZ7elW9CEBfZJW5Js',
          id: '0YSTRuZ7elW9CEBfZJW5Js',
          is_local: false,
          name: 'Hard For',
          popularity: 59,
          preview_url: 'https://p.scdn.co/mp3-preview/03232a3bcc3ee28b04aa4104776bb9ec456c58ff?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 8,
          type: 'track',
          uri: 'spotify:track:0YSTRuZ7elW9CEBfZJW5Js'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 101965,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/7uSe2N0R8hcSBOAhYu5RRW',
          id: '7uSe2N0R8hcSBOAhYu5RRW',
          is_local: false,
          name: 'Air Holes',
          popularity: 58,
          preview_url: 'https://p.scdn.co/mp3-preview/4fc768dc0ac7a2230b7e9a37f2199979b184916b?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 5,
          type: 'track',
          uri: 'spotify:track:7uSe2N0R8hcSBOAhYu5RRW'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 193101,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/0btR0bn9lQ9E7sw6dV58X8',
          id: '0btR0bn9lQ9E7sw6dV58X8',
          is_local: false,
          name: 'If I Want You',
          popularity: 49,
          preview_url: 'https://p.scdn.co/mp3-preview/81f41be8aef119c90d47b9f6aaad1f26d02162b9?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 5,
          type: 'track',
          uri: 'spotify:track:0btR0bn9lQ9E7sw6dV58X8'
        },
        {
          album: [Object],
          artists: [Array],
          available_markets: [Array],
          disc_number: 1,
          duration_ms: 200221,
          explicit: true,
          external_ids: [Object],
          external_urls: [Object],
          href: 'https://api.spotify.com/v1/tracks/1sbEeUY8KsdvgiQi26JBFz',
          id: '1sbEeUY8KsdvgiQi26JBFz',
          is_local: false,
          name: 'POPSTAR (feat. Drake)',
          popularity: 65,
          preview_url: 'https://p.scdn.co/mp3-preview/0aa1195d11e0eb9fee2dba226001a1189c7df69a?cid=3e1c8f186968494ba2a1891f461566cb',
          track_number: 8,
          type: 'track',
          uri: 'spotify:track:1sbEeUY8KsdvgiQi26JBFz'
        }
      ],
      seeds: [
        {
          initialPoolSize: 500,
          afterFilteringSize: 500,
          afterRelinkingSize: 500,
          id: '3F5CgOj3wFlRv51JsHbxhe',
          type: 'TRACK',
          href: 'https://api.spotify.com/v1/tracks/3F5CgOj3wFlRv51JsHbxhe'
        },
        {
          initialPoolSize: 995,
          afterFilteringSize: 626,
          afterRelinkingSize: 626,
          id: 'hip-hop',
          type: 'GENRE',
          href: null
        }
      ]
    }.tracks})
  }
  else if(currentCode[0] == 'b') {
    let playlist_names_A = getPlaylistNamesFromDB('a',currentCode)
    let playlist_names_B = getPlaylistNamesFromDB('b',currentCode)
    temp_ress.render("visual2", {playlist_names: playlist_names, playlists: selected_playlists, rec_tracks: recommended_tracks})
  }

}

export async function renderuser1ready() {
  console.log('rendering user1ready...')
  temp_ress.render("user1ready")
}


async function makeUserVector(selectedPlaylists) {

  console.log('making user vector...')
  // for item (=playlist id) get all tracks
  selected_playlists = []
  playlist_names = []
  selected_track_ids = []
  selected_artist_ids = []
  selected_genres = []
  recommended_tracks = []
  recommended_tracks_names = []
  recommended_tracks_artists = []
  recommended_tracks_urls = []
  for(var item in selectedPlaylists) {
    selected_playlists.push(item);
  }

  for (var playlist_id of selected_playlists) {
    var playlistData = await getData("/playlists/"+playlist_id)
    playlist_names.push(playlistData.name)
    const trackData = await getData("/playlists/"+playlist_id+'/tracks');
    // for track, get recommendations and push to recommended_tracks
    //console.log('retreived JSON for trackData = '+JSON.stringify(trackData)+'\n'+'\n')
    //console.log('artist name: ',trackData.items[0].track.artists[0].name)
    //console.log('song name: ',trackData.items[0].track.name)

    for (var track of trackData.items) {
      var artist_id = track.track.artists[0].id;
      var track_id = track.track.id;
      selected_track_ids.push(track_id)
      selected_artist_ids.push(artist_id)
    }
    console.log('\n\nadded selected tracks ids and artists ids to DB\n\n')
    for (var track of trackData.items) {
      var artist_id = track.track.artists[0].id;
      var track_id = track.track.id;
      if (recommended_tracks.length>5) {
        break;
      }
      //console.log("artist_id: "+artist_id)
      // console.log('artist name:',track.track.artists[0].name)
      //console.log("track_id: "+track_id)
      // console.log('track name:',track.track.name)

      const params = new URLSearchParams({
        limit: 3,
        seed_artist: artist_id,
        seed_genres: "pop",
        seed_tracks: track_id,
      });
      const recData = await getData("/recommendations?" + params);
      //console.log('retreived JSON: = '+JSON.stringify(recData)+'\n'+'\n')
      //console.log("recData.tracks[0].track: "+JSON.stringify(recData.tracks[0]))
      for (const reco_track of recData.tracks) {
        console.log('recommended_name:',reco_track.name)
        // console.log('recommended artists[0]',reco_track.artists[0])
        recommended_tracks.push(reco_track)
        recommended_tracks_names.push(reco_track.name)
        recommended_tracks_artists.push(reco_track.artists[0].name)
        recommended_tracks_urls.push(reco_track.preview_url)
      }
    }
  }
// variance=false: use average, variance=true: use Variance = average squared deviation
console.log('recommended tracks names:',recommended_tracks_names)
console.log('generating vector from tracks in vector.js...')
generate_vector_from_tracks(recommended_tracks, false)
}

// function to make GET request (used for various endpoints)
export async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  // console.log("GET request to: https://api.spotify.com/v1"+endpoint)
  const data = await response.json();
  //console.log('retreived data in getData = '+data)
  //console.log('retreived JSON in getData = '+JSON.stringify(data)+'\n'+'\n')

  // if you retreive user (/me) and there is no image found -> set default user image
  if (endpoint == "/me" && (data.images == undefined || data.images == [] || data.images.length < 1)) {
    console.log("no image found. setting default.\n")
    data.images = []
    data.images = [
      {
        height: null,
        url: 'https:/i.pinimg.com/originals/18/b9/ff/18b9ffb2a8a791d50213a9d595c4dd52.jpg',
        width: null
      }
    ]
    console.log("Profile pic set.")
    // console.log(data)
  }

  // if you retreive playlists and there is no image found -> set default image
  if (endpoint.includes("playlists") && endpoint.includes("me") && !(endpoint.includes("tracks"))) { //only check profile picture playlist when retreiving playlists (not tracks from 1)
    console.log("data.items (=playlists): "+data.items)
    for (const item of data.items) {
      if (item.images == undefined || item.images == [] || item.images.length < 1) {
        console.log("playlist image empty. setting default")
        item.images = []
        item.images = [
          {
            height: null,
            url: 'https://www.iphonefaq.org/files/styles/large/public/apple_music.jpg',
            width: null
          }
        ]
      }
    }
  }
  return data;
}

let listener = app.listen(3000, function () {
  console.log(
    "The app is listening on http://localhost:" + listener.address().port
  );
});
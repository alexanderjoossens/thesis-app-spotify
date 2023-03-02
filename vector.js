import { getData, rendercodepage } from "./server.js";
import { currentVector, modifyCurrentVector } from "./database_functionality.js";
import * as db_func from "./database_functionality.js"

let globalGeneratedVector = undefined
export{globalGeneratedVector}

export async function generate_vector_from_tracks(recommended_tracks, variance) {

    // variance is true or false. if false, then relative normalization is used.
    // mode variance: use Variance = average squared deviation of feature values (variance = ROOT of SUM of the SQUARED DIFFERENCE of the feature value and the AVERAGE feature value / AMOUNT of songs)
    const varianceBool = variance // there was a bug that the mode suddenly switched value... make constant for it.

    // TODO is this relative normalization OK? or should I use min/max of all possible values (of all songs in the world)?
    var longest_duration = 0
    var shortest_duration = 99999999999999999
    var loudest = 0
    var quietest = -99999
    var fastest_tempo = 0
    var slowest_tempo = 99999999999
    var highest_time_signature = 0
    var lowest_time_signature = 999999

    var sum_acousticness = 0
    var sum_danceability = 0
    var sum_energy = 0
    var sum_key = 0
    var sum_loudness = 0
    var sum_mode = 0
    var sum_speechiness = 0
    var sum_instrumentalness = 0
    var sum_liveness = 0
    var sum_tempo = 0
    var sum_duration_ms = 0
    var sum_time_signature = 0

    for (var track of recommended_tracks) {

        // GET request to get audio features from track
        var audioFeaturesData = await getData("/audio-features/" + track.id);
        var acousticness = audioFeaturesData.acousticness
        var danceability = audioFeaturesData.danceability
        var energy = audioFeaturesData.energy
        var key = audioFeaturesData.key
        var loudness = audioFeaturesData.loudness
        var mode = audioFeaturesData.mode
        var speechiness = audioFeaturesData.speechiness
        var instrumentalness = audioFeaturesData.instrumentalness
        var liveness = audioFeaturesData.liveness
        var tempo = audioFeaturesData.tempo
        var type = audioFeaturesData.type //not
        var id = audioFeaturesData.id //not
        var uri = audioFeaturesData.uri //not
        var track_href = audioFeaturesData.href //not
        var analysis_url = audioFeaturesData.analysis_url //not
        var duration_ms = audioFeaturesData.duration_ms
        var time_signature = audioFeaturesData.time_signature
        if (duration_ms<shortest_duration) {
            shortest_duration = duration_ms
        }
        if (duration_ms>longest_duration) {
            longest_duration = duration_ms
        }
        if (loudness<loudest) {
            loudest = loudness
        }
        if (loudness>quietest) {
            quietest = loudness
        }
        if (tempo>fastest_tempo) {
            fastest_tempo = tempo
        }
        if (tempo<slowest_tempo) {
            slowest_tempo = tempo
        }
        if (time_signature>highest_time_signature) {
            highest_time_signature = time_signature
        }
        if (time_signature<lowest_time_signature) {
            lowest_time_signature = time_signature
        }
        // average of feature values (avg = SUM of the feature values / AMOUNT of songs)
        sum_acousticness += acousticness
        sum_danceability += danceability
        sum_energy += energy
        sum_key += key
        sum_loudness += loudness
        sum_mode += mode
        sum_speechiness += speechiness
        sum_instrumentalness += instrumentalness
        sum_liveness += liveness
        sum_tempo += tempo
        // console.log("sum dur ms 1: "+sum_duration_ms)
        sum_duration_ms += duration_ms
        // console.log("sum dur ms 2: "+sum_duration_ms)
        sum_time_signature += time_signature
    }

    // average of feature values (avg = SUM of the feature values / AMOUNT of songs)
    var average_acousticness = sum_acousticness/recommended_tracks.length
    var average_danceability = sum_danceability/recommended_tracks.length
    var average_energy = sum_energy/recommended_tracks.length
    var average_key = sum_key/recommended_tracks.length
    var average_loudness = sum_loudness/recommended_tracks.length
    var average_mode = sum_mode/recommended_tracks.length
    var average_speechiness = sum_speechiness/recommended_tracks.length
    var average_instrumentalness = sum_instrumentalness/recommended_tracks.length
    var average_liveness = sum_liveness/recommended_tracks.length
    var average_tempo = sum_tempo/recommended_tracks.length
    var average_duration_ms = sum_duration_ms/recommended_tracks.length
    var average_time_signature = sum_time_signature/recommended_tracks.length

    // if mode variance: iterate again over the feature values to calculate the variance_sum
    // mode variance: use Variance = average squared deviation of feature values (variance = ROOT of SUM of the SQUARED DIFFERENCE of the feature value and the AVERAGE feature value / AMOUNT of songs)
    if (varianceBool == true) {
        var variance_sum_acousticness = 0
        var variance_sum_danceability = 0
        var variance_sum_energy = 0
        var variance_sum_key = 0
        var variance_sum_loudness = 0
        var variance_sum_mode = 0
        var variance_sum_speechiness = 0
        var variance_sum_instrumentalness = 0
        var variance_sum_liveness = 0
        var variance_sum_tempo = 0
        var variance_sum_duration_ms = 0
        var variance_sum_time_signature = 0
        for (var track of recommended_tracks) {
            // GET request to get audio features from track
            var audioFeaturesData = await getData("/audio-features/" + track.id);
            var acousticness = audioFeaturesData.acousticness
            var danceability = audioFeaturesData.danceability
            var energy = audioFeaturesData.energy
            var key = audioFeaturesData.key
            var loudness = audioFeaturesData.loudness
            var mode = audioFeaturesData.mode
            var speechiness = audioFeaturesData.speechiness
            var instrumentalness = audioFeaturesData.instrumentalness
            var liveness = audioFeaturesData.liveness
            var tempo = audioFeaturesData.tempo
            var type = audioFeaturesData.type //not
            var id = audioFeaturesData.id //not
            var uri = audioFeaturesData.uri //not
            var track_href = audioFeaturesData.href //not
            var analysis_url = audioFeaturesData.analysis_url //not
            var duration_ms = audioFeaturesData.duration_ms
            var time_signature = audioFeaturesData.time_signature

            variance_sum_acousticness += (acousticness-average_acousticness)**2
            variance_sum_danceability += (danceability-average_danceability)**2
            variance_sum_energy += (energy-average_energy)**2
            variance_sum_key += (key-average_key)**2
            variance_sum_loudness += (loudness-average_loudness)**2
            variance_sum_mode += (mode-average_mode)**2
            variance_sum_speechiness += (speechiness-average_speechiness)**2
            variance_sum_instrumentalness += (instrumentalness-average_instrumentalness)**2
            variance_sum_liveness += (liveness-average_liveness)**2
            variance_sum_tempo += (tempo-average_tempo)**2
            variance_sum_duration_ms += (duration_ms-average_duration_ms)**2
            variance_sum_time_signature += (time_signature-average_time_signature)**2
        }

        var variance_acousticness = Math.sqrt(variance_sum_acousticness)/recommended_tracks.length
        var variance_danceability = Math.sqrt(variance_sum_danceability)/recommended_tracks.length
        var variance_energy = Math.sqrt(variance_sum_energy)/recommended_tracks.length
        var variance_key = Math.sqrt(variance_sum_key)/recommended_tracks.length
        var variance_loudness = Math.sqrt(variance_sum_loudness)/recommended_tracks.length
        var variance_mode = Math.sqrt(variance_sum_mode)/recommended_tracks.length
        var variance_speechiness = Math.sqrt(variance_sum_speechiness)/recommended_tracks.length
        var variance_instrumentalness = Math.sqrt(variance_sum_instrumentalness)/recommended_tracks.length
        var variance_liveness = Math.sqrt(variance_sum_liveness)/recommended_tracks.length
        var variance_tempo = Math.sqrt(variance_sum_tempo)/recommended_tracks.length
        var variance_duration_ms = Math.sqrt(variance_sum_duration_ms)/recommended_tracks.length
        var variance_time_signature = Math.sqrt(variance_sum_time_signature)/recommended_tracks.length
    }

    // return (set currentVector) the overall vector ( left out "key" because average has no meaning here )
    if (varianceBool == false) {
        globalGeneratedVector = [average_acousticness, average_danceability, average_energy, 
            ((-average_loudness)-(-quietest))/(-loudest+quietest), average_mode, average_speechiness, 
            average_instrumentalness, average_liveness, 
            (average_tempo-slowest_tempo)/(fastest_tempo-slowest_tempo), 
            (average_duration_ms-shortest_duration)/(longest_duration-shortest_duration), 
            (average_time_signature-lowest_time_signature)/(highest_time_signature-lowest_time_signature)]
        // console.log("\nnormalized_averages: \n")
        // console.log(normalized_averages)
        // db_func.modifyCurrentVector(currentVector)
        // setTimeout
        console.log('this took a while bc of much getData() requests in generate_vector')
        console.log('wait 1sec to rendercodepage...')
        setTimeout(rendercodepage,1000)
        return
    }
    else if (varianceBool == true) {
        globalGeneratedVector = [variance_acousticness, variance_danceability, variance_energy, variance_key, 
            variance_loudness, variance_mode, variance_speechiness, variance_instrumentalness, variance_liveness, 
            variance_tempo, variance_duration_ms, variance_time_signature]
        // console.log("\nvariance_vector: \n")
        // console.log(variance_vector)
        // db_func.modifyCurrentVector(currentVector)
        console.log('wait 1sec to rendercodepage...')
        setTimeout(rendercodepage,1000)
        return
    }
}

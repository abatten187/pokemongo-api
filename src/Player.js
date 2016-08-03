import GeoCoder from 'geocoder'
import moment from 'moment'
import Auth from '~/Auth'
import geolib from 'geolib'

const LOGIN_CACHE_LOCATION = './.loginCache';
const MILLIS_PER_MINUTE = 60 * 1000;
let fs = require('fs');

// Gives a random meters in any direction
function getRandomDirection(){
  let latMorP = Math.random() < 0.5 ? -1 : 1
  let longMorP = Math.random() < 0.5 ? -1 : 1

  let latitude = ((Math.floor((Math.random() * 13) + 1))/100000)*latMorP
  let longitude = ((Math.floor((Math.random() * 13) + 1))/100000)*longMorP

  return {latitude, longitude}
}

class Player {
  constructor(parent) {
    this.parent = parent
    this.playerInfo = {
      accessToken: '',
      username: '',
      password: '',
      debug: true,
      latitude: 0,
      longitude: 0,
      altitude: 0,
      provider: '',
      sessionData: {},
      lastCheckpointSearch: {}
    }
    this.Auth = new Auth(parent)
  }

  set provider(provider) {
    this.playerInfo.provider = provider
  }

  set profileDetails(data) {
    this.playerInfo.sessionData = data
  }

  get location() {
    let { latitude, longitude } = this.playerInfo
    return { latitude, longitude }
  }

  set location(coords) {
    Object.assign(this.playerInfo, coords)
    return coords
  }

  get profile() {
    return this.playerInfo
  }

  /**
   * Player experience
   * @return {int} player experience
   */
  get experience(){
    return this.experience
  }

  /**
   * Previous level required xp
   * @return {int} xp required for level
   */
  get prev_level_xp(){
    return this.prev_level_xp
  }
  
  /**
   * Next level required xp
   * @return {int} xp required for level
   */
  get next_level_xp(){
    return this.next_level_xp
  }

  /**
   * Km walked in total
   * @return {float} total distance in km
   */
  get km_walked(){
    return this.km_walked
  }

  /**
   * Pokemons encountered
   * @return {int} number of pokemons
   */
  get pokemons_encountered(){
    return this.pokemons_encountered
  }

  /**
   * Unique pokedex entries
   * @return {int} total number of pokedex entries
   */
  get unique_pokedex_entries(){
    return this.unique_pokedex_entries
  }

  /**
   * Pokemons captured
   * @return {int} total captured
   */
  get pokemons_captured(){
    return this.pokemons_captured
  }

  /**
   * Evolutions
   * @return {int} Total evolutions
   */
  get evolutions(){
    return this.evolutions
  }

  /**
   * Poke stop visits
   * @return {int} total pokestop visits
   */
  get poke_stop_visits(){
    return this.poke_stop_visits
  }

  /**
   * Pokeballs thrown 
   * @return {int} Total balls throwed
   */
  get pokeballs_thrown(){
    return this.pokeballs_thrown
  }

  /**
   * Eggs hatched
   * @return {int} total eggs hatched
   */
  get eggs_hatched(){
    return this.eggs_hatched
  }

  /**
   * Big Magikarp captured
   * @return {int} total captured
   */
  get big_magikarp_caught(){
    return this.big_magikarp_caught
  }

  /**
   * Gym battles won
   * @return {int} total battles won
   */
  get battle_attack_won(){
    return this.battle_attack_won
  }

  /**
   * Gym attacks
   * @return {int} total attacks
   */
  get battle_attack_total(){
    return this.battle_attack_total
  }

  /**
   * Gym defendings
   * @return {int} total defendings
   */
  get battle_defended_won(){
    return this.battle_defended_won
  }

  /**
   * Gym training won
   * @return {int} total trainings won
   */
  get battle_training_won(){
    return this.battle_training_won
  }

  /**
   * Gym training total
   * @return {int} amount of training sessions
   */
  get battle_training_total(){
    return this.battle_training_total
  }

  /**
   * Presige raised
   * @return {int} total presige
   */
  get prestige_raised_total(){
    return this.prestige_raised_total
  }

  /**
   * Prestige dropped
   * @return {int} total dropped
   */
  get prestige_dropped_total(){
    return this.prestige_dropped_total
  }

  /**
   * Pokemons deployed
   * @return {int} total pokemons deployed
   */
  get pokemon_deployed(){
    return this.pokemon_deployed
  }

  /**
   * Small Rattata captured
   * @return {int} total captured
   */
  get small_rattata_caught(){
    return this.small_rattata_caught
  }



  /**
   * Pokemons captured by type
   * @return {[type]} [description]
   */
  // get pokemon_caught_by_type(){
  //   return this.pokemon_caught_by_type
  // }
  // 















  /**
   * Get Player level
   * @return {int} player level
   */
  get level(){
    return this.level
  }

  // TODO return Date obj
  get createdDate() {
    var date = new moment((this.playerInfo.sessionData.creation_timestamp_ms.toString() / 100)).format("dddd, MMMM Do YYYY, h:mm:ss a")
    this.parent.log.info(`[+] You are playing Pokemon Go since: {${date}}`)
    return date
  }

  /**
   * Pokemon max storage
   * @return {int} the max allowed pokemons in storage
   */
  get pokeMaxStorage() {
    var storage = this.playerInfo.sessionData.max_pokemon_storage
    this.parent.log.info(`[+] Poke Storage: {${storage}}`)
    return storage
  }

  /**
   * Items max storage
   * @return {int} the max allowed items in storage
   */
  get itemsMaxStorage() {
    var storage = this.playerInfo.sessionData.max_item_storage
    this.parent.log.info(`[+] Item Storage: {${storage}}`)
    return storage
  }


  /**
   * Get player currencies
   * @return {array} array with type and storage(amount)
   */
  get currency() {
    var curr = this.playerInfo.sessionData.currencies
    curr.map(obj => {
      this.parent.log.info(`[+] Currency (${obj.type}): {${storage}}`)
    })
    return curr
  }

  async Login(user, pass, forceRefreshLogin) {
    var loginCacheString = null
    var loginCache = null

    if (!forceRefreshLogin) {
      console.log('Checking for login cache.')
      try {
        loginCacheString = fs.readFileSync(LOGIN_CACHE_LOCATION, 'utf8')
      } catch (err) {
        console.log('Could not read loginCache: ' + err)
      }
      try {
        loginCache = JSON.parse(loginCacheString)
      } catch (err) {
        console.log('Could not parse loginCache: ' + err)
      }
    }

    var res
    if (loginCache &&
        (user === loginCache.username) &&
        ((Date.now() - loginCache.timestamp) < 10 * MILLIS_PER_MINUTE)) {
      console.log('Logging in with cache.')
      res = loginCache.accessToken
    } else {
      console.log('Logging in with regular auth.')
      res = await this.Auth.login(user, pass, this.playerInfo.provider)
    }

    // Save login details to disk.
    let cacheObj = {
      username: user,
      accessToken: res,
      timestamp: Date.now(),
    }
    let prettyJson = JSON.stringify(cacheObj, null, 2)
    try {
      fs.writeFileSync(LOGIN_CACHE_LOCATION, prettyJson)
      console.log('Login cache saved to file!')
    } catch (err) {
      console.log('Error saving cache to file: ' + err)
    }

    this.playerInfo.username = user
    this.playerInfo.password = pass
    this.playerInfo.accessToken = res

    return this.playerInfo
  }

  /**
   * Walk around like a human
   * @return {bool} returns true when done
   */
  walkAround(){
    let random = getRandomDirection()

    let destination = {
      latitude: this.location.latitude + random.latitude,
      longitude: this.location.longitude + random.longitude
    }

    let distance = geolib.getDistance(this.location, destination)
    this.location = destination
    this.parent.log.info(`[i] We just walked ${distance} meters`)
    return true
  }


  /**
   * Walk towards a point in human manner 
   * @param  {float} lat  latidude of the point to move against
   * @param  {float} long longitude of the point to move against
   * @return {bool} returns true when move complete
   */
  async walkToPoint(lat, long){

    let latRand = ((Math.floor((Math.random() * 13) + 1))/100000)
    let longRand = ((Math.floor((Math.random() * 13) + 1))/100000)

    if (this.playerInfo.latitude > lat)
      this.playerInfo.latitude = this.playerInfo.latitude-latRand
    else
      this.playerInfo.latitude = this.playerInfo.latitude+latRand

    if (this.playerInfo.longitude > long)
      this.playerInfo.longitude = this.playerInfo.longitude-longRand
    else
      this.playerInfo.longitude = this.playerInfo.longitude+longRand

    var distance = geolib.getDistance(
        {latitude: this.playerInfo.latitude, longitude: this.playerInfo.longitude},
        {latitude: lat, longitude: long}
    )

    //distance less than 10 meters?
    if (distance <= 10){
      this.parent.log.info(`[i] Walked to specified distance`)
      return true
    } else {
      this.parent.log.info(`[i] Walked closer to [`+lat+`,`+long+`] - distance is now: ${distance} meters`)
    }
  }


  hatchedEggs() {
    return this.parent.Call([{
      request: 'GET_HATCHED_EGGS',
    }])
  }


  /**
   * Player settings
   * @return {DownloadSettingsResponse} retrieves the player settings
   */
  settings() {
    return this.parent.Call([{
      request: 'DOWNLOAD_SETTINGS',
      message: {
        hash: "05daf51635c82611d1aac95c0b051d3ec088a930",
      }
    }])
  }

  /**
   * Downloads item templates
   * @return {DownloadItemTemplatesResponse}
   */
  itemTemplates() {
    return this.parent.Call([{
      request: 'DOWNLOAD_ITEM_TEMPLATES',
    }])
  }


  /**
   * Download configuration with app version, and so on
   * @return {DownloadRemoteConfigVersionResponse}
   */
  remoteConfigVersion() {
    return this.parent.Call([{
      request: 'DOWNLOAD_REMOTE_CONFIG_VERSION',
      message: {
        platform: 2, //android
        device_manufacturer: "Samsung",
        device_model: "SM-G920F",
        locale: "en-GB",
        app_version: 293,
      }
    }])
  }

}

export default Player

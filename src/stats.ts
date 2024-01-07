export type ClearType = 
    'NONE' |
    'TSPIN_MINI' |
    'TSPIN' |
    'TSPIN_MINI_SINGLE' |
    'TSPIN_SINGLE' |
    'SINGLE' |
    'TSPIN_MINI_DOUBLE' |
    'TSPIN_DOUBLE' |
    'DOUBLE' |
    'TSPIN_TRIPLE' |
    'TRIPLE' |
    'TSPIN_QUAD' |
    'QUAD' |
    'TSPIN_PENTA' |
    'PENTA' | 
    'PERFECT_CLEAR'

export type ClearTypes = {[key in ClearType] : number}

export type PlayerStats = {
    clearTypes: ClearTypes,

    tEfficiency: number,
    iEfficiency: number,

    cheeseApl: number,
    downstackApl: number,
    upstackApl: number,

    apl: number,
    app: number,

    kpp: number,
    kps: number,

    stackHeight: number,
    garbageHeight: number,

    spikeEfficiency: number,

    apm: number,
    openerApm: number,
    midgameApm: number,

    pps: number,
    btbWellshifts: number,

    btbChainEfficiency: number,
    btbChain: number,
    btbChainApm: number,
    btbChainAttack: number,
    btbChainWellshifts: number,
    btbChainApp: number,

    maxBtb: number,
    maxBtbAttack: number,

    comboChainEfficiency: number,
    comboChain: number,
    comboChainApm: number,
    comboChainAttack: number,
    comboChainApp: number,

    maxCombo: number,
    maxComboAttack: number,

    averageSpikePotential: number,
    averageDefencePotential: number,

    ppsVariance: number,
}
export type Players = {[key:string] :PlayerStats}

import { Console } from 'console'
import { Transform } from 'stream'

const ts = new Transform({ transform(chunk, _, cb) { cb(null, chunk) } })
const logger = new Console({ stdout: ts })


export function formatPlayers (players: Players) {
  let p = JSON.parse(JSON.stringify(players))
  for(const username in p){
    const data = p[username]
    delete data.clearTypes
    for(const key in data){
        data[key] = (data[key]).toFixed(2)
    }
  }
  logger.table(p)
  const table = (ts.read() || '').toString()
  return table
}


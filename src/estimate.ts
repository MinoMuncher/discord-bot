import * as tf from '@tensorflow/tfjs-node';
import { PlayerStats } from './stats';
function getTR(rating: number, rd: number) {
    const sat = (64 * Math.PI * Math.PI + 147 * Math.log(10) * Math.log(10))
    return 25000 / (1 + Math.pow(10, (1500 - rating) * Math.PI / Math.sqrt(3 * Math.log(10) * Math.log(10) * rd * rd + 2500 * sat)))
}
function normalizeStats(stats: PlayerStats){
    const hds = Object.values(stats.clearTypes).reduce((partialSum, a) => partialSum + a, 0);

    return {
        "TRIPLE": stats.clearTypes.TRIPLE/hds,
        "NONE": stats.clearTypes.NONE/hds,
        "DOUBLE":  stats.clearTypes.DOUBLE/hds,
        "SINGLE":  stats.clearTypes.SINGLE/hds,
        "TSPIN_DOUBLE":  stats.clearTypes.TSPIN_DOUBLE/hds,
        "TSPIN_PENTA": stats.clearTypes.TSPIN_PENTA/hds,
        "TSPIN_MINI_DOUBLE": stats.clearTypes.TSPIN_MINI_DOUBLE/hds,
        "QUAD":  stats.clearTypes.QUAD/hds,
        "TSPIN_TRIPLE": stats.clearTypes.TSPIN_TRIPLE/hds,
        "TSPIN_QUAD": stats.clearTypes.TSPIN_QUAD/hds,
        "TSPIN_MINI": stats.clearTypes.TSPIN_MINI/hds,
        "TSPIN_MINI_SINGLE": stats.clearTypes.TSPIN_MINI_SINGLE/hds,
        "PENTA": stats.clearTypes.PENTA/hds,
        "PERFECT_CLEAR": stats.clearTypes.PERFECT_CLEAR/hds,
        "TSPIN": stats.clearTypes.TSPIN/hds,
        "TSPIN_SINGLE": stats.clearTypes.TSPIN_SINGLE/hds,
        "tEfficiency": Math.min(Math.max(0, stats.tEfficiency/1),1),
        "iEfficiency": Math.min(Math.max(0, stats.iEfficiency/1),1),
        "cheeseApl": Math.min(Math.max(0, stats.cheeseApl/5),1),
        "downstackApl": Math.min(Math.max(0, stats.downstackApl/5),1),
        "upstackApl": Math.min(Math.max(0, stats.upstackApl/5),1),
        "apl": Math.min(Math.max(0, stats.apl/5),1),
        "app": Math.min(Math.max(0, stats.app/3),1),
        "kpp": Math.min(Math.max(0, stats.kpp/5),1),
        "kps": Math.min(Math.max(0, stats.kps/20),1),
        "stackHeight": Math.min(Math.max(0, stats.stackHeight/20),1),
        "garbageHeight": Math.min(Math.max(0, stats.garbageHeight/20),1),
        "spikeEfficiency": Math.min(Math.max(0, stats.spikeEfficiency/1),1),
        "apm": Math.min(Math.max(0, stats.apm/300),1),
        "openerApm": Math.min(Math.max(0, stats.openerApm/500),1),
        "midgameApm": Math.min(Math.max(0, stats.midgameApm/300),1),
        "pps": Math.min(Math.max(0, stats.pps/5),1),
        "openerPps": Math.min(Math.max(0, stats.openerPps/5),1),
        "midgamePps": Math.min(Math.max(0, stats.midgamePps/5),1),
        "btbChainEfficiency": Math.min(Math.max(0, stats.btbChainEfficiency/1),1),
        "btbChain": Math.min(Math.max(0, stats.btbChain/20),1),
        "btbChainApm": Math.min(Math.max(0, stats.btbChainApm/500),1),
        "btbChainAttack": Math.min(Math.max(0, stats.btbChainAttack/100),1),
        "btbChainApp": Math.min(Math.max(0, stats.btbChainApp/5),1),
        "comboChainEfficiency": Math.min(Math.max(0, stats.comboChainEfficiency/1),1),
        "comboChain": Math.min(Math.max(0, stats.comboChain/10),1),
        "comboChainApm": Math.min(Math.max(0, stats.comboChainApm/500),1),
        "comboChainAttack": Math.min(Math.max(0, stats.comboChainAttack/50),1),
        "comboChainApp": Math.min(Math.max(0, stats.comboChainApp/5),1),
        "averageSpikePotential": Math.min(Math.max(0, stats.averageSpikePotential/1),1),
        "averageDefencePotential": Math.min(Math.max(0, stats.averageDefencePotential/30),1),
        "blockfishScore": Math.min(Math.max(0, stats.blockfishScore/20),1),
        "burstPps": Math.min(Math.max(0, stats.burstPps/10),1),
        "attackDelayRate": Math.min(Math.max(0, stats.attackDelayRate/1),1),
        "preAttackDelayRate": Math.min(Math.max(0, stats.preAttackDelayRate/1),1)
    }
}

const handler = tf.io.fileSystem("/Users/mattzhu/Documents/tetris/custom-stats/discord-bot/src/util/model/model.json");
const model = await tf.loadLayersModel(handler)

export function estimateRating(stats: PlayerStats){
    let prediction = model.predict(tf.tensor2d([Object.values(normalizeStats(stats))]))
    if (Array.isArray(prediction)){
        prediction = prediction[0]
    }
    const glicko = prediction.dataSync()[0] * 4500
    return [glicko, getTR(glicko, 75)]
}
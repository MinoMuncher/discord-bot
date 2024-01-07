import { Players } from "../stats";
import { createLineClearGraph } from "./bar";
import { createRadarGraph } from "./radar";
export async function generateGraphs(stats: Players) {
    let imageDatas: Buffer[] = []

    {
        imageDatas.push(await createLineClearGraph(stats))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.apm, s.openerApm, s.pps, s.midgameApm]
        }
        const radarConfig =
            [{
                label: "APM",
                min: 0,
                max: 200,
            }, {
                label: "Opener APM",
                min: 0,
                max: 250,
            }, {
                label: "PPS",
                min: 0,
                max: 5,
            }, {
                label: "Midgame APM",
                min: 0,
                max: 250,
            }]
        imageDatas.push(await createRadarGraph(radarData, radarConfig))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.upstackApl, s.tEfficiency, s.downstackApl, s.iEfficiency]
        }
        const radarConfig =
            [{
                label: "Upstack APL",
                min: 0,
                max: 3,
            }, {
                label: "T Piece Efficiency",
                min: 0,
                max: 1,
            }, {
                label: "Downstack APL",
                min: 0,
                max: 3,
            }, {
                label: "I Piece Efficiency",
                min: 0,
                max: 1,
            }]
        imageDatas.push(await createRadarGraph(radarData, radarConfig))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.stackHeight, s.averageSpikePotential, s.garbageHeight, s.averageDefencePotential]
        }
        const radarConfig =
            [{
                label: "Stack Height",
                min: 0,
                max: 10,
            }, {
                label: "Board Spike Potential",
                min: 0,
                max: 0.06,
            }, {
                label: "Garbage Height",
                min: 0,
                max: 10,
            }, {
                label: "Board Defence Potential",
                min: 17,
                max: 23,
            }]
        imageDatas.push(await createRadarGraph(radarData, radarConfig))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.btbChainEfficiency, s.btbChain, s.btbChainAttack, s.btbChainApm, s.comboChainEfficiency, s.comboChain, s.comboChainAttack, s.comboChainApm]
        }
        const radarConfig =
            [{
                label: "B2B Chain Conversion Rate",
                min: 0,
                max: 0.06,
            }, {
                label: "B2B Chain Length",
                min: 0,
                max: 11.4,
            }, {
                label: "B2B Chain Attack",
                min: 0,
                max: 70,
            }, {
                label: "B2B Chain APM",
                min: 0,
                max: 300,
            },
            {
                label: "Combo Chain Conversion Rate",
                min: 0,
                max: 0.14,
            }, {
                label: "Combo Chain Length",
                min: 0,
                max: 10,
            }, {
                label: "Combo Chain Attack",
                min: 0,
                max: 20,
            }, {
                label: "Combo Chain APM",
                min: 0,
                max: 560,
            }
            ]
        imageDatas.push(await createRadarGraph(radarData, radarConfig))
    }
    return imageDatas
}
import { Players } from "../stats";
import { createLineClearGraph } from "./bar";
import { createRadarGraph } from "./radar";
//scaling is pretty disorganized, pipe ended so this is how itll be done for now
type Normalization = "average" | "stat"

export async function generateGraphs(stats: Players, norm: Normalization, scale: boolean, order: string[]) {
    let imageDatas: Buffer[] = []
    const edgeMult = 1.2
    {
        imageDatas.push(await createLineClearGraph(stats, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(6).fill(0)
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.pps, s.openerApm, s.openerPps, s.apm, s.midgamePps, s.midgameApm]
            const scales = [s.pps / 5, s.openerApm / 250, s.openerPps / 5, s.apm / 250, s.midgamePps / 5, s.midgameApm / 250]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
            })
        }
        const radarConfig =
            [{
                label: "PPS",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 5 : Math.max(max[0], max[2], max[4])) * edgeMult : 5,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Opener APM",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 250 : Math.max(max[1], max[3], max[5])) * edgeMult : 250,
                format: (n: number) => String(Math.round(n))

            }, {
                label: "Opener PPS",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 5 : Math.max(max[0], max[2], max[4])) * edgeMult : 5,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "APM",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 250 : Math.max(max[1], max[3], max[5])) * edgeMult : 250,
                format: (n: number) => String(Math.round(n))
            }, {
                label: "Midgame PPS",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 5 : Math.max(max[0], max[2], max[4])) * edgeMult : 5,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Midgame APM",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 250 : Math.max(max[1], max[3], max[5])) * edgeMult : 250,
                format: (n: number) => String(Math.round(n))
            },]
        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(6).fill(0)
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.upstackApl, s.cheeseApl, s.tEfficiency, s.downstackApl, s.apl, s.iEfficiency]
            const scales = [s.upstackApl / 3, s.cheeseApl / 3, s.tEfficiency, s.downstackApl / 3, s.apl / 3, s.iEfficiency]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
            })
        }
        const radarConfig =
            [{
                label: "Upstack APL",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 3 : Math.max(max[0], max[1], max[3], max[4])) * edgeMult : 3,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Cheese APL",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 3 : Math.max(max[0], max[1], max[3], max[4])) * edgeMult : 3,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "T Piece Efficiency",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax : Math.max(max[2], max[5])) * edgeMult : 1,
                format: (n: number) => `${Math.floor(n * 100)}%`
            }, {
                label: "Downstack APL",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 3 : Math.max(max[0], max[1], max[3], max[4])) * edgeMult : 3,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "APL",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 3 : Math.max(max[0], max[1], max[3], max[4])) * edgeMult : 3,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "I Piece Efficiency",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax : Math.max(max[2], max[5])) * edgeMult : 1,

                format: (n: number) => `${Math.floor(n * 100)}%`
            }]
        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(5).fill(0)
        let scaleMin = 0
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.stackHeight, s.averageSpikePotential, s.garbageHeight, s.averageDefencePotential, s.blockfishScore]
            const scales = [s.stackHeight / 10, s.averageSpikePotential / 0.12, s.garbageHeight / 10, (s.averageDefencePotential - 17) / 6, (s.blockfishScore - 1)/2]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
                scaleMin = Math.min(scaleMin, key)
            })
        }
        const radarConfig =
            [{
                label: "Stack Height",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 10 : Math.max(max[0], max[2])) * edgeMult : 10,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Board Spike Potential",
                min: 0,
                max: scale ? scaleMax * edgeMult * 0.12 : 0.12,
                format: (n: number) => `${((n * 100).toFixed(2))}%`
            }, {
                label: "Garbage Height",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 10 : Math.max(max[0], max[2])) * edgeMult : 10,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Board Defence Potential",
                min: scale ? (Math.min(0, scaleMin) * 6 + 17) : 17,
                max: scale ? (scaleMax * 6 * edgeMult + 17)  : 23,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Pieces To Garbage",
                min: scale ? Math.min(0, scaleMin) * 2 + 1 : 1,
                max: scale ? (scaleMax* 2 * edgeMult + 1) : 3,
                format: (n: number) => String(n.toFixed(2))
            }]

        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(8).fill(0)
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.btbChainEfficiency, s.btbChain, s.btbChainAttack, s.btbChainApm, s.comboChainEfficiency, s.comboChain, s.comboChainAttack, s.comboChainApm]
            const scales = [s.btbChainEfficiency / 0.3, s.btbChain / 11.4, s.btbChainAttack / 70, s.btbChainApm / 300, s.comboChainEfficiency / 0.06, s.comboChain / 10, s.comboChainAttack / 20, s.comboChainApm / 560]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
            })
        }
        const radarConfig =
            [{
                label: "B2B Chain Conversion Rate",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 0.3 : Math.max(max[0], max[4])) * edgeMult : 0.3,
                format: (n: number) => `${((n * 100).toFixed(2))}%`
            }, {
                label: "B2B Chain Length",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 11.4 : Math.max(max[1], max[5])) * edgeMult : 11.4,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "B2B Chain Attack",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 70 : Math.max(max[2], max[6])) * edgeMult : 70,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "B2B Chain APM",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 300 : Math.max(max[3], max[7])) * edgeMult : norm == "average" ? 300 : 560,
                format: (n: number) => String(Math.round(n))
            },
            {
                label: "Combo Chain Conversion Rate",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 0.06 : Math.max(max[0], max[4])) * edgeMult : norm == "average" ?  0.06 : 0.3,
                format: (n: number) => `${((n * 100).toFixed(2))}%`
            }, {
                label: "Combo Chain Length",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 10 : Math.max(max[1], max[5])) * edgeMult : norm == "average" ? 10 : 11.14,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Combo Chain Attack",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 20 : Math.max(max[2], max[6])) * edgeMult : norm == "average" ? 20 : 70,
                format: (n: number) => String(n.toFixed(2))
            }, {
                label: "Combo Chain APM",
                min: 0,
                max: scale ? (norm == "average" ? scaleMax * 560 : Math.max(max[3], max[7])) * edgeMult : 560,
                format: (n: number) => String(Math.round(n))
            }
            ]
        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(3).fill(0)
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.app, s.comboChainApp, s.btbChainApp]
            const scales = [s.app / 1.4, s.comboChainApp / 3, s.btbChainApp / 1.6]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
            })
        }
        const radarConfig =
            [
                {
                    label: "APP",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 1.4 : Math.max(max[0], max[1], max[2])) * edgeMult : norm == "average" ? 1.4 : 3,
                    format: (n: number) => String(n.toFixed(2))
                },
                {
                    label: "Combo Chain APP",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 3 : Math.max(max[0], max[1], max[2])) * edgeMult : 3,
                    format: (n: number) => String(n.toFixed(2))
                }, {
                    label: "B2B Chain APP",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 1.6 : Math.max(max[0], max[1], max[2])) * edgeMult : norm == "average" ? 1.6 : 3,
                    format: (n: number) => String(n.toFixed(2))
                },
            ]
        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    {
        let radarData: { [key: string]: number[] } = {}
        let max: number[] = Array(6).fill(0)
        let scaleMax = 0
        for (const key in stats) {
            let s = stats[key]
            radarData[key] = [s.pps, s.kps, s.attackDelayRate, s.burstPps, s.kpp, s.preAttackDelayRate]
            const scales = [s.pps / 5, s.kps / 22, s.attackDelayRate / 0.15, s.burstPps / 10, s.kpp / 7, s.preAttackDelayRate / 0.15]
            radarData[key].forEach((key, idx) => {
                max[idx] = Math.max(max[idx], key)
            })
            scales.forEach((key) => {
                scaleMax = Math.max(scaleMax, key)
            })
        }
        const radarConfig =
            [
                {
                    label: "PPS",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 5 : Math.max(max[0], max[3])) * edgeMult : norm == "average" ? 5 : 10,
                    format: (n: number) => String(n.toFixed(2))
                },
                {
                    label: "Keys Per Second",
                    min: 0,
                    max: scale ? scaleMax * 22 * edgeMult : 22,
                    format: (n: number) => String(n.toFixed(2))
                },
                {
                    label: "Attack Delay Rate",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 0.2 : Math.max(max[2], max[5])) * edgeMult : 0.2,
                    format: (n: number) => `${((n * 100).toFixed(2))}%`
                },
                {
                    label: "Burst PPS",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 10 : Math.max(max[0], max[3])) * edgeMult : 10,
                    format: (n: number) => String(n.toFixed(2))
                },
                {
                    label: "Keys Per Piece",
                    min: 0,
                    max: scale ? scaleMax * 7 * edgeMult : 7,
                    format: (n: number) => String(n.toFixed(2))
                },
                {
                    label: "Tank Before Attack Rate",
                    min: 0,
                    max: scale ? (norm == "average" ? scaleMax * 0.15 : Math.max(max[2], max[5])) * edgeMult : 0.15,
                    format: (n: number) => `${((n * 100).toFixed(2))}%`
                },
            ]
        imageDatas.push(await createRadarGraph(radarData, radarConfig, order))
    }
    return imageDatas
}